package com.example.frly.section.service;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.email.EmailService;
import com.example.frly.group.GroupContext;
import com.example.frly.group.model.Group;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.notification.NotificationService;
import com.example.frly.section.model.Reminder;
import com.example.frly.section.repository.ReminderRepository;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderJobService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GroupRepository groupRepository;
    private final NotificationService notificationService;

    // Run roughly once an hour instead of every minute to reduce load
    @Scheduled(fixedRate = 60_000)
    public void processDueReminders() {
        String originalGroupId = GroupContext.getGroupId();
        try {
            java.util.List<Group> groups = groupRepository.findAll();
            for (Group group : groups) {
                GroupContext.setGroupId(String.valueOf(group.getId()));
                processDueRemindersForCurrentGroup();
            }
        } finally {
            GroupContext.setGroupId(originalGroupId);
        }
    }

    @Transactional
    protected void processDueRemindersForCurrentGroup() {
        LocalDateTime now = LocalDateTime.now();
        List<Reminder> due = reminderRepository.findByIsSentFalseAndNotifyTrueAndStatusAndTriggerTimeLessThanEqual(RecordStatus.ACTIVE, now);

        if (due.isEmpty()) {
            return;
        }

        for (Reminder reminder : due) {
            Long creatorId = reminder.getCreatedBy();
            if (creatorId == null) {
                // Shouldn't normally happen, but guard just in case
                reminder.setSent(true);
                continue;
            }

            User user = userRepository.findById(creatorId).orElse(null);
            if (user == null) {
                reminder.setSent(true);
                continue;
            }

            // Respect user-level preference for EMAILS only; in-app notifications are still created.
            if (user.isReminderEmailEnabled()) {
                try {
                    String subject = "fryly reminder: " + reminder.getTitle();
                    String template = emailService.loadTemplate("email/reminder-due.html");
                    String description = reminder.getDescription() != null ? reminder.getDescription() : "";

                    String html = template
                            .replace("{{FIRST_NAME}}", user.getFirstName() != null ? user.getFirstName() : "there")
                            .replace("{{REMINDER_TITLE}}", reminder.getTitle() != null ? reminder.getTitle() : "Your reminder")
                            .replace("{{REMINDER_DESCRIPTION}}", description);

                    emailService.sendHtml(user.getEmail(), subject, html);
                } catch (Exception ex) {
                    log.error("Failed to send reminder email for reminder {}", reminder.getId(), ex);
                    // Don't mark as sent here so we can retry on the next run
                    continue;
                }
            }

            // Always create an in-app notification so the reminder also appears in the bell icon.
            String notifTitle = reminder.getTitle() != null ? reminder.getTitle() : "Reminder due";
            String notifMessage = "Reminder due: " + notifTitle;
            notificationService.notifyUser(user.getId(), "REMINDER_DUE", notifMessage);

            // Handle frequency: ONCE (or null) => mark sent; DAILY/WEEKLY => schedule next occurrence
            String freq = reminder.getFrequency();
            if (freq == null || freq.equalsIgnoreCase("ONCE")) {
                reminder.setSent(true);
            } else if (freq.equalsIgnoreCase("DAILY")) {
                reminder.setTriggerTime(reminder.getTriggerTime().plusDays(1));
            } else if (freq.equalsIgnoreCase("WEEKLY")) {
                reminder.setTriggerTime(reminder.getTriggerTime().plusWeeks(1));
            } else if (freq.equalsIgnoreCase("MONTHLY")) {
                reminder.setTriggerTime(reminder.getTriggerTime().plusMonths(1));
            } else if (freq.equalsIgnoreCase("YEARLY")) {
                reminder.setTriggerTime(reminder.getTriggerTime().plusYears(1));
            } else {
                // Unknown frequency, mark as sent to avoid looping forever
                reminder.setSent(true);
            }
        }

        reminderRepository.saveAll(due);
    }
}
