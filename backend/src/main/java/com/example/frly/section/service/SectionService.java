package com.example.frly.section.service;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.dto.CreateListItemRequestDto;
import com.example.frly.section.dto.CreateSectionRequestDto;
import com.example.frly.section.dto.ListItemDto;
import com.example.frly.section.dto.SectionDto;
import com.example.frly.section.model.ListItem;
import com.example.frly.section.dto.NoteDto;
import com.example.frly.section.dto.UpdateNoteRequestDto;
import com.example.frly.section.dto.ReminderDto;
import com.example.frly.section.dto.CreateReminderRequestDto;
import com.example.frly.section.model.Note;
import com.example.frly.section.model.Reminder;
import com.example.frly.section.model.CalendarEvent;
import com.example.frly.section.model.CalendarEventMember;
import com.example.frly.section.model.Section;
import com.example.frly.section.repository.*;
import static com.example.frly.constants.LogConstants.*;
import com.example.frly.section.model.SectionType;
import com.example.frly.auth.AuthUtil;
import com.example.frly.group.GroupContext;
import com.example.frly.group.service.GroupService;
import com.example.frly.section.SectionMapper;
import com.example.frly.user.UserRepository;
import com.example.frly.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepository sectionRepository;
    private final ListItemRepository listItemRepository;
    private final NoteRepository noteRepository;
    private final ReminderRepository reminderRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final CalendarEventMemberRepository calendarEventMemberRepository;
    private final GroupService groupService;
    private final SectionMapper sectionMapper;
    private final UserRepository userRepository;

    private Section requireActiveSection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            throw new BadRequestException("Section is deleted");
        }
        return section;
    }

    // --- SECTIONS ---

    @Transactional
    public Long createSection(CreateSectionRequestDto request) {
        validateGroupAccess();

        Section section = new Section();
        section.setTitle(request.getTitle());
        section.setType(request.getType());

        // Handle Parent Folder
        if (request.getParentId() != null) {
            Section parent = sectionRepository.getReferenceById(request.getParentId());
            validateSectionType(parent, SectionType.FOLDER, "Parent section must be a FOLDER");
            section.setParentSection(parent);
        }

        // Default position: at the end (naive implementation)
        section.setPosition(999); 
        
        section = sectionRepository.save(section);
        log.info("Section created: id={} type={}", section.getId(), section.getType());

        // Initialize Note if type is NOTE
        if (section.getType() == SectionType.NOTE) {
            Note note = new Note();
            note.setSection(section);
            note.setContent("");
            noteRepository.save(note);
            log.info(NOTE_CREATED, section.getId());
        }

        return section.getId();
    }

    public List<SectionDto> getSections() {
        validateGroupAccess();

        return sectionRepository.findByStatusNotOrderByPositionAsc(RecordStatus.DELETED).stream()
                .map(sectionMapper::toSectionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        validateGroupAccess();
        deleteSectionRecursively(sectionId);
    }

    private void deleteSectionRecursively(Long sectionId) {
        java.util.List<Section> children = sectionRepository.findByParentSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);
        for (Section child : children) {
            deleteSectionRecursively(child.getId());
        }

        Section section = sectionRepository.findById(sectionId).orElseThrow();
        section.setStatus(RecordStatus.DELETED);
        sectionRepository.save(section);
    }

    // --- LIST ITEMS ---

    @Transactional
    public Long addListItem(Long sectionId, CreateListItemRequestDto request) {
        validateGroupAccess();
        Section section = requireActiveSection(sectionId);
        validateSectionType(section, SectionType.LIST, "Cannot add list item to non-LIST section");

        ListItem item = new ListItem();
        item.setSection(section);
        item.setText(request.getText());
        item.setDueDate(request.getDueDate());
        item.setCompleted(false);
        item.setPosition(999); // Naive position

        item = listItemRepository.save(item);
        return item.getId();
    }

    public List<ListItemDto> getListItems(Long sectionId) {
        validateGroupAccess();
        requireActiveSection(sectionId);
        return listItemRepository.findBySectionIdAndStatusNotOrderByPositionAsc(sectionId, RecordStatus.DELETED).stream()
                .map(sectionMapper::toListItemDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleListItem(Long itemId) {
        validateGroupAccess();

        ListItem item = listItemRepository.findById(itemId)
                .orElseThrow(() -> new BadRequestException("List item not found"));
        validateSectionNotDeleted(item.getSection());

        item.setCompleted(!item.isCompleted());
        listItemRepository.save(item);
    }

    // --- NOTES ---

    public NoteDto getNote(Long sectionId) {
        validateGroupAccess();
        requireActiveSection(sectionId);

        Note note = noteRepository.findBySectionId(sectionId)
            .orElseThrow(() -> new BadRequestException("Note not found for section " + sectionId));

        NoteDto dto = sectionMapper.toNoteDto(note);
        dto.setVersion(note.getVersion());
        dto.setLastEditedAt(note.getUpdatedAt());

        if (note.getUpdatedBy() != null) {
            userRepository.findById(note.getUpdatedBy()).ifPresent(user ->
                dto.setLastEditedByName(formatUserName(user))
            );
        }

        return dto;
    }

    @Transactional
    public NoteDto updateNote(Long sectionId, UpdateNoteRequestDto request) {
        validateGroupAccess();
        requireActiveSection(sectionId);

        Note note = noteRepository.findBySectionId(sectionId)
            .orElseThrow(() -> new BadRequestException("Note not found for section " + sectionId));

        // Optimistic locking: if client provided a version, ensure it matches current
        if (request.getVersion() != null && !request.getVersion().equals(note.getVersion())) {
            throw new jakarta.persistence.OptimisticLockException("Note was updated by someone else");
        }

        note.setContent(request.getContent());
        note = noteRepository.save(note);
        log.info(NOTE_UPDATED, sectionId);

        // Build DTO from already-saved entity (no need to reload)
        NoteDto dto = sectionMapper.toNoteDto(note);
        dto.setVersion(note.getVersion());
        dto.setLastEditedAt(note.getUpdatedAt());

        if (note.getUpdatedBy() != null) {
            userRepository.findById(note.getUpdatedBy()).ifPresent(user ->
                dto.setLastEditedByName(formatUserName(user))
            );
        }

        return dto;
    }

    // --- REMINDERS ---

    @Transactional
    public Long addReminder(Long sectionId, CreateReminderRequestDto request) {
        validateGroupAccess();
        Section section = requireActiveSection(sectionId);
        validateSectionType(section, SectionType.REMINDER, "Cannot add reminder to non-REMINDER section");

        Reminder reminder = new Reminder();
        reminder.setSection(section);
        reminder.setTitle(request.getTitle());
        reminder.setDescription(request.getDescription());
        reminder.setTriggerTime(request.getTriggerTime());
        reminder.setSent(false);
        if (request.getNotify() != null) {
            reminder.setNotify(request.getNotify());
        }
        reminder.setFrequency(request.getFrequency());

        reminder = reminderRepository.save(reminder);
        log.info(REMINDER_CREATED, reminder.getId());
        return reminder.getId();
    }

    public List<ReminderDto> getReminders(Long sectionId) {
        validateGroupAccess();
        requireActiveSection(sectionId);
        return reminderRepository.findBySectionIdAndStatusNotOrderByTriggerTimeAsc(sectionId, RecordStatus.DELETED).stream()
                .map(sectionMapper::toReminderDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReminder(Long reminderId) {
        validateGroupAccess();
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new BadRequestException("Reminder not found"));
        validateSectionNotDeleted(reminder.getSection());

        reminder.setStatus(RecordStatus.DELETED);
        reminderRepository.save(reminder);
    }

    @Transactional
    public void updateReminder(Long reminderId, com.example.frly.section.dto.UpdateReminderRequestDto request) {
        validateGroupAccess();
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new BadRequestException("Reminder not found"));
        validateSectionNotDeleted(reminder.getSection());

        if (request.getTitle() != null) {
            reminder.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            reminder.setDescription(request.getDescription());
        }
        if (request.getTriggerTime() != null) {
            reminder.setTriggerTime(request.getTriggerTime());
        }
        if (request.getNotify() != null) {
            reminder.setNotify(request.getNotify());
        }
        if (request.getFrequency() != null) {
            reminder.setFrequency(request.getFrequency());
        }

        reminderRepository.save(reminder);
    }

    // --- CALENDAR EVENTS ---

    @Transactional
    public Long addCalendarEvent(Long sectionId, com.example.frly.section.dto.CreateCalendarEventRequestDto request) {
        validateGroupAccess();
        Section section = requireActiveSection(sectionId);
        validateSectionType(section, SectionType.CALENDAR, "Cannot add calendar event to non-CALENDAR section");

        CalendarEvent event = new CalendarEvent();
        event.setSection(section);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(request.getLocation());
        event.setCategory(request.getCategory());

        event = calendarEventRepository.save(event);

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            createCalendarEventMembers(event, request.getMemberIds());
        }

        return event.getId();
    }

    public java.util.List<com.example.frly.section.dto.CalendarEventDto> getCalendarEvents(Long sectionId) {
        validateGroupAccess();
        requireActiveSection(sectionId);

        java.util.List<CalendarEvent> events = calendarEventRepository.findBySectionIdOrderByStartTimeAsc(sectionId);

        // Optimization: Batch fetch event members to prevent N+1
        java.util.List<Long> eventIds = events.stream().map(CalendarEvent::getId).toList();
        java.util.Map<Long, java.util.List<Long>> membersByEvent = new java.util.HashMap<>();
        if (!eventIds.isEmpty()) {
            for (CalendarEventMember cem : calendarEventMemberRepository.findByEventIdIn(eventIds)) {
                membersByEvent
                    .computeIfAbsent(cem.getEvent().getId(), k -> new java.util.ArrayList<>())
                    .add(cem.getUser().getId());
            }
        }

        // Optimization: Batch fetch all creators to prevent N+1 query
        java.util.Set<Long> creatorIds = events.stream()
                .map(CalendarEvent::getCreatedBy)
                .filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());

        java.util.Map<Long, com.example.frly.user.User> usersById = java.util.Collections.emptyMap();
        if (!creatorIds.isEmpty()) {
            usersById = userRepository.findAllById(creatorIds).stream()
                    .collect(java.util.stream.Collectors.toMap(
                            com.example.frly.user.User::getId,
                            user -> user
                    ));
        }

        final java.util.Map<Long, com.example.frly.user.User> usersByIdFinal = usersById;

        return events.stream()
            .map(event -> {
                var dto = sectionMapper.toCalendarEventDto(event);
                if (event.getCreatedBy() != null) {
                    com.example.frly.user.User creator = usersByIdFinal.get(event.getCreatedBy());
                    if (creator != null) {
                        dto.setCreatedByName(formatUserName(creator));
                    }
                }
                dto.setMemberIds(membersByEvent.getOrDefault(event.getId(), java.util.Collections.emptyList()));
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteCalendarEvent(Long eventId) {
        validateGroupAccess();
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new BadRequestException("Calendar event not found"));
        validateSectionNotDeleted(event.getSection());

        calendarEventMemberRepository.deleteByEventId(eventId);
        calendarEventRepository.deleteById(eventId);
    }

    @Transactional
    public void updateCalendarEvent(Long eventId, com.example.frly.section.dto.UpdateCalendarEventRequestDto request) {
        validateGroupAccess();

        CalendarEvent event = calendarEventRepository.findById(eventId)
            .orElseThrow(() -> new BadRequestException("Calendar event not found"));
        validateSectionNotDeleted(event.getSection());

        if (request.getTitle() != null) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getStartTime() != null) {
            event.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            event.setEndTime(request.getEndTime());
        }
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getCategory() != null) {
            event.setCategory(request.getCategory());
        }

        calendarEventRepository.save(event);

        if (request.getMemberIds() != null) {
            updateCalendarEventMembers(event, request.getMemberIds());
        }
    }

    // ============== Private Helper Methods ==============

    /**
     * Validates group access for current user - extracted to reduce duplication
     */
    private void validateGroupAccess() {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
    }

    /**
     * Validates that section is not deleted
     */
    private void validateSectionNotDeleted(Section section) {
        if (section != null && section.getStatus() == RecordStatus.DELETED) {
            throw new BadRequestException("Section is deleted");
        }
    }

    /**
     * Validates that section type matches expected type
     */
    private void validateSectionType(Section section, SectionType expectedType, String errorMessage) {
        if (section.getType() != expectedType) {
            throw new BadRequestException(errorMessage);
        }
    }

    /**
     * Formats user's full name or returns email as fallback
     */
    private String formatUserName(com.example.frly.user.User user) {
        if (user == null) {
            return "";
        }
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? " " + user.getLastName() : "";
        String fullName = (firstName + lastName).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }

    /**
     * Updates calendar event members in batch
     */
    private void updateCalendarEventMembers(CalendarEvent event, List<Long> memberIds) {
        // Delete existing members
        calendarEventMemberRepository.deleteByEventId(event.getId());

        // Batch create new members
        createCalendarEventMembers(event, memberIds);
    }

    /**
     * Creates calendar event members in batch
     */
    private void createCalendarEventMembers(CalendarEvent event, List<Long> memberIds) {
        List<CalendarEventMember> members = memberIds.stream()
                .map(userId -> {
                    CalendarEventMember cem = new CalendarEventMember();
                    cem.setEvent(event);
                    com.example.frly.user.User user = new com.example.frly.user.User();
                    user.setId(userId);
                    cem.setUser(user);
                    return cem;
                })
                .collect(Collectors.toList());

        calendarEventMemberRepository.saveAll(members);
    }

}
