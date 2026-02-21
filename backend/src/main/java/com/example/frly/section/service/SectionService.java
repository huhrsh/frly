package com.example.frly.section.service;

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
import com.example.frly.section.model.Section;
import com.example.frly.section.repository.*;
import static com.example.frly.constants.LogConstants.*;
import com.example.frly.section.model.SectionType;
import com.example.frly.auth.AuthUtil;
import com.example.frly.group.GroupContext;
import com.example.frly.group.service.GroupService;
import com.example.frly.section.SectionMapper;
import com.example.frly.user.UserRepository;
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
    private final GroupService groupService;
    private final SectionMapper sectionMapper;
    private final UserRepository userRepository;

    // --- SECTIONS ---

    @Transactional
    public Long createSection(CreateSectionRequestDto request) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = new Section();
        section.setTitle(request.getTitle());
        section.setType(request.getType());

        // Handle Parent Folder
        if (request.getParentId() != null) {
            Section parent = sectionRepository.getReferenceById(request.getParentId());
            if (parent.getType() != SectionType.FOLDER) {
                throw new IllegalArgumentException("Parent section must be a FOLDER");
            }
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
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        return sectionRepository.findAllByOrderByPositionAsc().stream()
                .map(sectionMapper::toSectionDto)
                .collect(Collectors.toList());
    }

    // --- LIST ITEMS ---

    @Transactional
    public Long addListItem(Long sectionId, CreateListItemRequestDto request) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.getReferenceById(sectionId);
        
        // Validate section type
        if (section.getType() != SectionType.LIST) {
            throw new IllegalArgumentException("Cannot add list item to non-LIST section");
        }

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
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        return listItemRepository.findBySectionIdOrderByPositionAsc(sectionId).stream()
                .map(sectionMapper::toListItemDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleListItem(Long itemId) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        
        ListItem item = listItemRepository.findById(itemId).orElseThrow();
        item.setCompleted(!item.isCompleted());
        listItemRepository.save(item);
    }

    // --- NOTES ---

    public NoteDto getNote(Long sectionId) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Note note = noteRepository.findBySectionId(sectionId)
            .orElseThrow(() -> new RuntimeException("Note not found for section " + sectionId));

        NoteDto dto = sectionMapper.toNoteDto(note);
        dto.setVersion(note.getVersion());
        dto.setLastEditedAt(note.getUpdatedAt());

        if (note.getUpdatedBy() != null) {
            userRepository.findById(note.getUpdatedBy()).ifPresent(user -> {
            String name = (user.getFirstName() != null ? user.getFirstName() : "")
                + (user.getLastName() != null ? (" " + user.getLastName()) : "");
            dto.setLastEditedByName(name.trim().isEmpty() ? user.getEmail() : name.trim());
            });
        }

        return dto;
    }

    @Transactional
    public NoteDto updateNote(Long sectionId, UpdateNoteRequestDto request) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Note note = noteRepository.findBySectionId(sectionId)
            .orElseThrow(() -> new RuntimeException("Note not found for section " + sectionId));

        // Optimistic locking: if client provided a version, ensure it matches current
        if (request.getVersion() != null && !request.getVersion().equals(note.getVersion())) {
            throw new jakarta.persistence.OptimisticLockException("Note was updated by someone else");
        }

        note.setContent(request.getContent());
        note = noteRepository.save(note);
        log.info(NOTE_UPDATED, sectionId);

        NoteDto dto = sectionMapper.toNoteDto(note);
        dto.setVersion(note.getVersion());
        dto.setLastEditedAt(note.getUpdatedAt());

        if (note.getUpdatedBy() != null) {
            userRepository.findById(note.getUpdatedBy()).ifPresent(user -> {
                String name = (user.getFirstName() != null ? user.getFirstName() : "")
                    + (user.getLastName() != null ? (" " + user.getLastName()) : "");
                dto.setLastEditedByName(name.trim().isEmpty() ? user.getEmail() : name.trim());
            });
        }

        return dto;
    }

    // --- REMINDERS ---

    @Transactional
    public Long addReminder(Long sectionId, CreateReminderRequestDto request) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.getReferenceById(sectionId);
        if (section.getType() != SectionType.REMINDER) {
            throw new IllegalArgumentException("Cannot add reminder to non-REMINDER section");
        }

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
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        return reminderRepository.findBySectionIdOrderByTriggerTimeAsc(sectionId).stream()
                .map(sectionMapper::toReminderDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReminder(Long reminderId) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        reminderRepository.deleteById(reminderId);
    }

    @Transactional
    public void updateReminder(Long reminderId, com.example.frly.section.dto.UpdateReminderRequestDto request) {
        // Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

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

}
