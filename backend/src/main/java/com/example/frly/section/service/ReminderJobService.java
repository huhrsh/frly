package com.example.frly.section.service;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.email.EmailService;
import com.example.frly.group.GroupContext;
import com.example.frly.group.model.Group;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.notification.NotificationService;
import com.example.frly.section.enums.ReminderFrequency;
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
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderJobService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GroupRepository groupRepository;
    private final NotificationService notificationService;

    // Cache the email template after first load
    private String cachedEmailTemplate;

    // Run roughly once an hour instead of every minute to reduce load
    @Scheduled(fixedRate = 60_000)
    public void processDueReminders() {
        String originalGroupId = GroupContext.getGroupId();
        try {
            // Optimization: Only fetch active groups that might have reminders
            List<Group> groups = groupRepository.findByStatus(RecordStatus.ACTIVE);

            log.info("Processing due reminders for {} active groups", groups.size());
            int totalProcessed = 0;

            for (Group group : groups) {
                GroupContext.setGroupId(String.valueOf(group.getId()));
                try {
                    int processed = processDueRemindersForCurrentGroup();
                    totalProcessed += processed;
                } catch (Exception e) {
                    log.error("Error processing reminders for group {}", group.getId(), e);
                    // Continue processing other groups even if one fails
                }
            }

            if (totalProcessed > 0) {
                log.info("Successfully processed {} reminders across all groups", totalProcessed);
            }
        } finally {
            GroupContext.setGroupId(originalGroupId);
        }
    }

    @Transactional
    protected int processDueRemindersForCurrentGroup() {
        LocalDateTime now = LocalDateTime.now();
        List<Reminder> dueReminders = reminderRepository
                .findByIsSentFalseAndNotifyTrueAndStatusAndTriggerTimeLessThanEqual(RecordStatus.ACTIVE, now);

        if (dueReminders.isEmpty()) {
            return 0;
        }

        // Optimization: Batch fetch all users to prevent N+1 queries
        Set<Long> userIds = dueReminders.stream()
                .map(Reminder::getCreatedBy)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // Load email template once (cached after first load)
        if (cachedEmailTemplate == null) {
            cachedEmailTemplate = emailService.loadTemplate("email/reminder-due.html");
        }

        int processedCount = 0;

        for (Reminder reminder : dueReminders) {
            try {
                if (processReminder(reminder, usersById)) {
                    processedCount++;
                }
            } catch (Exception e) {
                log.error("Failed to process reminder {}: {}", reminder.getId(), e.getMessage(), e);
                // Continue processing other reminders even if one fails
            }
        }

        // Batch save all reminders at once
        reminderRepository.saveAll(dueReminders);

        return processedCount;
    }

    /**
     * Process a single reminder: send email and notification, handle frequency
     * @return true if processed successfully, false otherwise
     */
    private boolean processReminder(Reminder reminder, Map<Long, User> usersById) {
        Long creatorId = reminder.getCreatedBy();
        if (creatorId == null) {
            log.warn("Reminder {} has no creator, marking as sent", reminder.getId());
            reminder.setSent(true);
            return false;
        }

        User user = usersById.get(creatorId);
        if (user == null) {
            log.warn("User {} not found for reminder {}, marking as sent", creatorId, reminder.getId());
            reminder.setSent(true);
            return false;
        }

        // Send email notification if user has email reminders enabled
        if (user.isReminderEmailEnabled()) {
            sendReminderEmail(user, reminder);
        }

        // Always create an in-app notification
        createInAppNotification(user, reminder);

        // Handle recurring reminders based on frequency
        handleReminderFrequency(reminder);

        return true;
    }

    /**
     * Sends reminder email to user
     */
    private void sendReminderEmail(User user, Reminder reminder) {
        try {
            String subject = "fryly reminder: " + reminder.getTitle();
            String firstName = user.getFirstName() != null ? user.getFirstName() : "there";
            String title = reminder.getTitle() != null ? reminder.getTitle() : "Your reminder";
            String description = reminder.getDescription() != null ? reminder.getDescription() : "";

            String html = cachedEmailTemplate
                    .replace("{{FIRST_NAME}}", firstName)
                    .replace("{{REMINDER_TITLE}}", title)
                    .replace("{{REMINDER_DESCRIPTION}}", description);

            emailService.sendHtml(user.getEmail(), subject, html);
            log.debug("Sent reminder email for reminder {} to user {}", reminder.getId(), user.getEmail());
        } catch (Exception ex) {
            log.error("Failed to send reminder email for reminder {} to user {}",
                    reminder.getId(), user.getEmail(), ex);
            // Don't throw - we still want to create in-app notification
        }
    }

    /**
     * Creates in-app notification for reminder
     */
    private void createInAppNotification(User user, Reminder reminder) {
        try {
            String notifTitle = reminder.getTitle() != null ? reminder.getTitle() : "Reminder due";
            String notifMessage = "Reminder due: " + notifTitle;
            notificationService.notifyUser(user.getId(), "REMINDER_DUE", notifMessage);
            log.debug("Created in-app notification for reminder {} to user {}", reminder.getId(), user.getId());
        } catch (Exception ex) {
            log.error("Failed to create notification for reminder {} to user {}",
                    reminder.getId(), user.getId(), ex);
        }
    }

    /**
     * Handles reminder frequency: marks as sent for one-time, or schedules next occurrence for recurring
     */
    private void handleReminderFrequency(Reminder reminder) {
        ReminderFrequency frequency = ReminderFrequency.fromString(reminder.getFrequency());

        if (frequency.shouldRepeat()) {
            LocalDateTime nextTrigger = frequency.calculateNextOccurrence(reminder.getTriggerTime());
            if (nextTrigger != null) {
                reminder.setTriggerTime(nextTrigger);
                log.debug("Rescheduled {} reminder {} to {}", frequency, reminder.getId(), nextTrigger);
            } else {
                reminder.setSent(true);
            }
        } else {
            reminder.setSent(true);
            log.debug("Marked one-time reminder {} as sent", reminder.getId());
        }
    }
}
