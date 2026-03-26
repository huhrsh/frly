package com.example.frly.section.service;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.email.EmailService;
import com.example.frly.group.GroupContext;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.Group;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.notification.NotificationRequest;
import com.example.frly.notification.NotificationService;
import com.example.frly.notification.NotificationType;
import com.example.frly.section.enums.ReminderFrequency;
import com.example.frly.section.model.Reminder;
import com.example.frly.section.model.Section;
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
    private final GroupMemberRepository groupMemberRepository;
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
        // Use JOIN FETCH query to eagerly load Section to avoid LazyInitializationException
        List<Reminder> dueReminders = reminderRepository
                .findDueRemindersWithSection(RecordStatus.ACTIVE, now);

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
     * Process a single reminder: send email and notification to all group members, handle frequency
     * @return true if processed successfully, false otherwise
     */
    private boolean processReminder(Reminder reminder, Map<Long, User> usersById) {
        Long creatorId = reminder.getCreatedBy();
        if (creatorId == null) {
            log.warn("Reminder {} has no creator, marking as sent", reminder.getId());
            reminder.setSent(true);
            return false;
        }

        // Get section (should be eagerly loaded via JOIN FETCH)
        Section section = reminder.getSection();
        if (section == null) {
            log.warn("Reminder {} has no section, marking as sent", reminder.getId());
            reminder.setSent(true);
            return false;
        }
        
        // Get groupId from section
        String groupIdStr = section.getGroupId();
        if (groupIdStr == null) {
            log.warn("Reminder {} section has no groupId, marking as sent", reminder.getId());
            reminder.setSent(true);
            return false;
        }
        
        Long groupId;
        try {
            groupId = Long.valueOf(groupIdStr);
        } catch (NumberFormatException e) {
            log.warn("Reminder {} has invalid groupId format: {}, marking as sent", reminder.getId(), groupIdStr);
            reminder.setSent(true);
            return false;
        }
        
        List<User> groupMembers = groupMemberRepository
                .findByGroupIdAndStatusWithUser(groupId, GroupMemberStatus.APPROVED)
                .stream()
                .map(gm -> gm.getUser())
                .toList();
                
        if (groupMembers.isEmpty()) {
            log.warn("No approved members found for group {} of reminder {}, marking as sent", groupId, reminder.getId());
            reminder.setSent(true);
            return false;
        }

        // Send emails and notifications to all approved group members
        for (User member : groupMembers) {
            // Send email notification if reminder has notify=true AND user has email reminders enabled
            if (reminder.isNotify() && member.isReminderEmailEnabled()) {
                sendReminderEmail(member, reminder);
            }

            // Always create an in-app notification (regardless of notify flag)
            createInAppNotification(member, reminder);
        }

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
            
            // Get creator name for the notification
            User creator = null;
            String actorName = "Someone";
            if (reminder.getCreatedBy() != null) {
                creator = userRepository.findById(reminder.getCreatedBy()).orElse(null);
                if (creator != null) {
                    String firstName = creator.getFirstName() != null ? creator.getFirstName() : "";
                    String lastName = creator.getLastName() != null ? " " + creator.getLastName() : "";
                    String fullName = (firstName + lastName).trim();
                    actorName = fullName.isEmpty() ? creator.getEmail() : fullName;
                }
            }
            
            // Get section info (should be eagerly loaded)
            Section section = reminder.getSection();
            Long groupId = null;
            Long sectionId = null;
            
            if (section != null) {
                sectionId = section.getId();
                String groupIdStr = section.getGroupId();
                if (groupIdStr != null) {
                    try {
                        groupId = Long.valueOf(groupIdStr);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid groupId format for reminder {}: {}", reminder.getId(), groupIdStr);
                    }
                }
            }
            
            // Use full NotificationRequest with all fields for push to work
            NotificationRequest request = new NotificationRequest();
            request.setUserId(user.getId());
            request.setType(NotificationType.REMINDER_DUE);
            request.setTitle(notifTitle);
            request.setMessage(notifMessage);
            request.setGroupId(groupId);
            request.setSectionId(sectionId);
            request.setActorName(actorName);
            request.setSectionType("REMINDER");
            
            notificationService.notifyUser(request);
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
