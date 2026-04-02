package com.example.frly.section;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.GroupContext;
import com.example.frly.group.service.GroupService;
import com.example.frly.notification.NotificationService;
import com.example.frly.section.dto.*;
import com.example.frly.section.model.*;
import com.example.frly.section.repository.*;
import com.example.frly.section.service.SectionService;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SectionServiceTest {

    @Mock private SectionRepository sectionRepository;
    @Mock private ListItemRepository listItemRepository;
    @Mock private LinkItemRepository linkItemRepository;
    @Mock private NoteRepository noteRepository;
    @Mock private ReminderRepository reminderRepository;
    @Mock private CalendarEventRepository calendarEventRepository;
    @Mock private CalendarEventMemberRepository calendarEventMemberRepository;
    @Mock private UserSectionOrderRepository userSectionOrderRepository;
    @Mock private GroupService groupService;
    @Mock private SectionMapper sectionMapper;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private SectionService sectionService;

    private static final Long USER_ID  = 10L;
    private static final String GROUP_ID = "1";

    @BeforeEach
    void setUp() {
        JwtUserPrincipal principal = new JwtUserPrincipal(USER_ID, "user@example.com");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())
        );
        GroupContext.setGroupId(GROUP_ID);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        GroupContext.clear();
    }

    // ─── createSection ───────────────────────────────────────────────────────

    @Test
    void createSection_list_savesAndReturnsId() {
        CreateSectionRequestDto req = new CreateSectionRequestDto();
        req.setTitle("Groceries");
        req.setType(SectionType.LIST);

        Section saved = buildSection(5L, "Groceries", SectionType.LIST);
        when(sectionRepository.save(any(Section.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        Long id = sectionService.createSection(req);

        assertEquals(5L, id);
        verify(sectionRepository).save(any(Section.class));
        verify(noteRepository, never()).save(any());
    }

    @Test
    void createSection_note_initializesEmptyNote() {
        CreateSectionRequestDto req = new CreateSectionRequestDto();
        req.setTitle("Meeting Notes");
        req.setType(SectionType.NOTE);

        Section saved = buildSection(6L, "Meeting Notes", SectionType.NOTE);
        when(sectionRepository.save(any(Section.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.createSection(req);

        verify(noteRepository).save(argThat(note -> "".equals(note.getContent())));
    }

    // ─── updateSectionTitle ──────────────────────────────────────────────────

    @Test
    void updateSectionTitle_updatesAndSaves() {
        Section section = buildSection(1L, "Old", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        UpdateSectionTitleRequestDto req = new UpdateSectionTitleRequestDto();
        req.setTitle("New Title");

        sectionService.updateSectionTitle(1L, req);

        assertEquals("New Title", section.getTitle());
        verify(sectionRepository).save(section);
    }

    @Test
    void updateSectionTitle_withBlankTitle_throwsBadRequest() {
        Section section = buildSection(1L, "Old", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        UpdateSectionTitleRequestDto req = new UpdateSectionTitleRequestDto();
        req.setTitle("  ");

        assertThrows(BadRequestException.class, () -> sectionService.updateSectionTitle(1L, req));
        verify(sectionRepository, never()).save(any());
    }

    @Test
    void updateSectionTitle_whenSectionDeleted_throwsBadRequest() {
        Section section = buildSection(1L, "Old", SectionType.LIST);
        section.setStatus(RecordStatus.DELETED);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        UpdateSectionTitleRequestDto req = new UpdateSectionTitleRequestDto();
        req.setTitle("New");

        assertThrows(BadRequestException.class, () -> sectionService.updateSectionTitle(1L, req));
    }

    // ─── updateSectionDisplayMode ────────────────────────────────────────────

    @Test
    void updateSectionDisplayMode_onListSection_updatesMode() {
        Section section = buildSection(1L, "My List", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        UpdateSectionDisplayModeRequestDto req = new UpdateSectionDisplayModeRequestDto();
        req.setListDisplayMode("CHECKBOX_STATIC");

        sectionService.updateSectionDisplayMode(1L, req);

        assertEquals(ListDisplayMode.CHECKBOX_STATIC, section.getListDisplayMode());
        verify(sectionRepository).save(section);
    }

    @Test
    void updateSectionDisplayMode_onNoteSection_throwsBadRequest() {
        Section section = buildSection(1L, "My Note", SectionType.NOTE);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        UpdateSectionDisplayModeRequestDto req = new UpdateSectionDisplayModeRequestDto();
        req.setListDisplayMode("CHECKBOX");

        assertThrows(BadRequestException.class,
            () -> sectionService.updateSectionDisplayMode(1L, req));
    }

    // ─── deleteSection ───────────────────────────────────────────────────────

    @Test
    void deleteSection_softDeletesSection() {
        Section section = buildSection(1L, "My List", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(sectionRepository.findByParentSectionIdAndStatusNot(1L, RecordStatus.DELETED))
            .thenReturn(Collections.emptyList());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.deleteSection(1L);

        assertEquals(RecordStatus.DELETED, section.getStatus());
        verify(sectionRepository).save(section);
    }

    // ─── addListItem ─────────────────────────────────────────────────────────

    @Test
    void addListItem_toListSection_savesAndReturnsId() {
        Section section = buildSection(1L, "Groceries", SectionType.LIST);
        ListItem saved = buildListItem(10L, "Milk", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(listItemRepository.save(any(ListItem.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        CreateListItemRequestDto req = new CreateListItemRequestDto();
        req.setText("Milk");

        Long id = sectionService.addListItem(1L, req);

        assertEquals(10L, id);
        verify(listItemRepository).save(argThat(item ->
            "Milk".equals(item.getText()) && !item.isCompleted()
        ));
    }

    @Test
    void addListItem_toNoteSection_throwsBadRequest() {
        Section section = buildSection(1L, "My Note", SectionType.NOTE);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreateListItemRequestDto req = new CreateListItemRequestDto();
        req.setText("text");

        assertThrows(BadRequestException.class, () -> sectionService.addListItem(1L, req));
    }

    // ─── getListItems ────────────────────────────────────────────────────────

    @Test
    void getListItems_returnsMappedDtos() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        ListItem item = buildListItem(1L, "Buy eggs", section);
        ListItemDto dto = new ListItemDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(listItemRepository.findBySectionIdAndStatusNotOrderByPositionAsc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(item));
        when(sectionMapper.toListItemDto(item)).thenReturn(dto);

        List<ListItemDto> result = sectionService.getListItems(1L);

        assertEquals(1, result.size());
        assertSame(dto, result.get(0));
    }

    // ─── toggleListItem ──────────────────────────────────────────────────────

    @Test
    void toggleListItem_fromIncompleteToComplete() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        ListItem item = buildListItem(5L, "Buy milk", section);
        item.setCompleted(false);

        when(listItemRepository.findById(5L)).thenReturn(Optional.of(item));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.toggleListItem(5L);

        assertTrue(item.isCompleted());
        verify(listItemRepository).save(item);
    }

    @Test
    void toggleListItem_fromCompleteToIncomplete_doesNotSendNotification() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        ListItem item = buildListItem(5L, "Buy milk", section);
        item.setCompleted(true);

        when(listItemRepository.findById(5L)).thenReturn(Optional.of(item));

        sectionService.toggleListItem(5L);

        assertFalse(item.isCompleted());
        // Notification is only sent when completing (false -> true), not un-completing
        verify(notificationService, never()).notifyGroupMembers(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void toggleListItem_whenNotFound_throwsBadRequest() {
        when(listItemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> sectionService.toggleListItem(99L));
    }

    @Test
    void toggleListItem_whenSectionDeleted_throwsBadRequest() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        section.setStatus(RecordStatus.DELETED);
        ListItem item = buildListItem(5L, "Task", section);

        when(listItemRepository.findById(5L)).thenReturn(Optional.of(item));

        assertThrows(BadRequestException.class, () -> sectionService.toggleListItem(5L));
    }

    // ─── deleteListItem ──────────────────────────────────────────────────────

    @Test
    void deleteListItem_softDeletesItem() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        ListItem item = buildListItem(5L, "Buy bread", section);

        when(listItemRepository.findById(5L)).thenReturn(Optional.of(item));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.deleteListItem(5L);

        assertEquals(RecordStatus.DELETED, item.getStatus());
        verify(listItemRepository).save(item);
    }

    @Test
    void deleteListItem_whenNotFound_throwsBadRequest() {
        when(listItemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> sectionService.deleteListItem(99L));
    }

    // ─── getNote ─────────────────────────────────────────────────────────────

    @Test
    void getNote_whenNoteExists_returnsDto() {
        Section section = buildSection(1L, "Notes", SectionType.NOTE);
        Note note = buildNote(1L, "Hello", section, 1);
        NoteDto dto = new NoteDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(noteRepository.findBySectionId(1L)).thenReturn(Optional.of(note));
        when(sectionMapper.toNoteDto(note)).thenReturn(dto);

        NoteDto result = sectionService.getNote(1L);

        assertNotNull(result);
    }

    @Test
    void getNote_whenNoteNotFound_throwsBadRequest() {
        Section section = buildSection(1L, "Notes", SectionType.NOTE);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(noteRepository.findBySectionId(1L)).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> sectionService.getNote(1L));
    }

    // ─── updateNote (optimistic locking) ─────────────────────────────────────

    @Test
    void updateNote_withMatchingVersion_savesContent() {
        Section section = buildSection(1L, "Notes", SectionType.NOTE);
        Note note = buildNote(1L, "Old", section, 3);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(noteRepository.findBySectionId(1L)).thenReturn(Optional.of(note));
        when(noteRepository.save(note)).thenReturn(note);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
        when(sectionMapper.toNoteDto(note)).thenReturn(new NoteDto());

        UpdateNoteRequestDto req = new UpdateNoteRequestDto();
        req.setContent("Updated");
        req.setVersion(3);

        assertDoesNotThrow(() -> sectionService.updateNote(1L, req));
        assertEquals("Updated", note.getContent());
    }

    @Test
    void updateNote_withStaleVersion_throwsOptimisticLockException() {
        Section section = buildSection(1L, "Notes", SectionType.NOTE);
        Note note = buildNote(1L, "Current", section, 5);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(noteRepository.findBySectionId(1L)).thenReturn(Optional.of(note));

        UpdateNoteRequestDto req = new UpdateNoteRequestDto();
        req.setContent("Stale");
        req.setVersion(3); // Server has version 5

        assertThrows(OptimisticLockException.class, () -> sectionService.updateNote(1L, req));
        assertEquals("Current", note.getContent()); // Not modified
    }

    @Test
    void updateNote_withNullVersion_skipsVersionCheck() {
        Section section = buildSection(1L, "Notes", SectionType.NOTE);
        Note note = buildNote(1L, "Old", section, 99);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(noteRepository.findBySectionId(1L)).thenReturn(Optional.of(note));
        when(noteRepository.save(note)).thenReturn(note);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
        when(sectionMapper.toNoteDto(note)).thenReturn(new NoteDto());

        UpdateNoteRequestDto req = new UpdateNoteRequestDto();
        req.setContent("Force overwrite");
        req.setVersion(null);

        assertDoesNotThrow(() -> sectionService.updateNote(1L, req));
        assertEquals("Force overwrite", note.getContent());
    }

    // ─── addReminder ─────────────────────────────────────────────────────────

    @Test
    void addReminder_toReminderSection_savesAndReturnsId() {
        Section section = buildSection(1L, "Reminders", SectionType.REMINDER);
        Reminder saved = buildReminder(7L, "Call dentist", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(reminderRepository.save(any(Reminder.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        CreateReminderRequestDto req = new CreateReminderRequestDto();
        req.setTitle("Call dentist");
        req.setTriggerTime(java.time.LocalDateTime.now().plusDays(1));

        Long id = sectionService.addReminder(1L, req);

        assertEquals(7L, id);
        verify(reminderRepository).save(argThat(r -> "Call dentist".equals(r.getTitle()) && !r.isSent()));
    }

    @Test
    void addReminder_toListSection_throwsBadRequest() {
        Section section = buildSection(1L, "My List", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreateReminderRequestDto req = new CreateReminderRequestDto();
        req.setTitle("Invalid");

        assertThrows(BadRequestException.class, () -> sectionService.addReminder(1L, req));
    }

    // ─── deleteReminder ──────────────────────────────────────────────────────

    @Test
    void deleteReminder_softDeletesReminder() {
        Section section = buildSection(1L, "Reminders", SectionType.REMINDER);
        Reminder reminder = buildReminder(3L, "Doctor", section);

        when(reminderRepository.findById(3L)).thenReturn(Optional.of(reminder));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.deleteReminder(3L);

        assertEquals(RecordStatus.DELETED, reminder.getStatus());
        verify(reminderRepository).save(reminder);
    }

    @Test
    void deleteReminder_whenNotFound_throwsBadRequest() {
        when(reminderRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> sectionService.deleteReminder(99L));
    }

    // ─── updateListItem ──────────────────────────────────────────────────────

    @Test
    void updateListItem_updatesTextAndSaves() {
        Section section = buildSection(1L, "List", SectionType.LIST);
        ListItem item = buildListItem(5L, "Old text", section);

        when(listItemRepository.findById(5L)).thenReturn(Optional.of(item));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        UpdateListItemRequestDto req = new UpdateListItemRequestDto();
        req.setText("New text");

        sectionService.updateListItem(5L, req);

        assertEquals("New text", item.getText());
        verify(listItemRepository).save(item);
    }

    @Test
    void updateListItem_whenNotFound_throwsBadRequest() {
        when(listItemRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateListItemRequestDto req = new UpdateListItemRequestDto();
        req.setText("text");

        assertThrows(BadRequestException.class, () -> sectionService.updateListItem(99L, req));
    }

    // ─── getReminders ────────────────────────────────────────────────────────

    @Test
    void getReminders_returnsMappedDtos() {
        Section section = buildSection(1L, "Reminders", SectionType.REMINDER);
        Reminder reminder = buildReminder(1L, "Dentist", section);
        ReminderDto dto = new ReminderDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(reminderRepository.findBySectionIdAndStatusNotOrderByTriggerTimeAsc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(reminder));
        when(sectionMapper.toReminderDto(reminder)).thenReturn(dto);

        List<ReminderDto> result = sectionService.getReminders(1L);

        assertEquals(1, result.size());
        assertSame(dto, result.get(0));
    }

    // ─── updateReminder ──────────────────────────────────────────────────────

    @Test
    void updateReminder_updatesFieldsAndSaves() {
        Section section = buildSection(1L, "Reminders", SectionType.REMINDER);
        Reminder reminder = buildReminder(3L, "Old title", section);

        when(reminderRepository.findById(3L)).thenReturn(Optional.of(reminder));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        UpdateReminderRequestDto req = new UpdateReminderRequestDto();
        req.setTitle("New title");

        sectionService.updateReminder(3L, req);

        assertEquals("New title", reminder.getTitle());
        verify(reminderRepository).save(reminder);
    }

    @Test
    void updateReminder_whenNotFound_throwsBadRequest() {
        when(reminderRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateReminderRequestDto req = new UpdateReminderRequestDto();
        req.setTitle("x");

        assertThrows(BadRequestException.class, () -> sectionService.updateReminder(99L, req));
    }

    // ─── addLink ─────────────────────────────────────────────────────────────

    @Test
    void addLink_toLinksSection_savesAndReturnsId() {
        Section section = buildSection(1L, "My Links", SectionType.LINKS);
        LinkItem saved = buildLinkItem(20L, "GitHub", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(linkItemRepository.save(any(LinkItem.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        CreateLinkRequestDto req = new CreateLinkRequestDto();
        req.setKey("GitHub");
        req.setUrl("https://github.com");

        Long id = sectionService.addLink(1L, req);

        assertEquals(20L, id);
        verify(linkItemRepository).save(argThat(link -> "GitHub".equals(link.getKey())));
    }

    @Test
    void addLink_toNonLinksSection_throwsBadRequest() {
        Section section = buildSection(1L, "My Note", SectionType.NOTE);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreateLinkRequestDto req = new CreateLinkRequestDto();
        req.setKey("k");
        req.setUrl("https://x.com");

        assertThrows(BadRequestException.class, () -> sectionService.addLink(1L, req));
    }

    // ─── getLinks ────────────────────────────────────────────────────────────

    @Test
    void getLinks_returnsMappedDtos() {
        Section section = buildSection(1L, "Links", SectionType.LINKS);
        LinkItem link = buildLinkItem(1L, "Docs", section);
        LinkDto dto = new LinkDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(linkItemRepository.findBySectionIdAndStatusNotOrderByPositionAsc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(link));
        when(sectionMapper.toLinkDto(link)).thenReturn(dto);

        List<LinkDto> result = sectionService.getLinks(1L);

        assertEquals(1, result.size());
        assertSame(dto, result.get(0));
    }

    // ─── updateLink ──────────────────────────────────────────────────────────

    @Test
    void updateLink_updatesFieldsAndSaves() {
        Section section = buildSection(1L, "Links", SectionType.LINKS);
        LinkItem link = buildLinkItem(5L, "OldKey", section);

        when(linkItemRepository.findById(5L)).thenReturn(Optional.of(link));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        UpdateLinkRequestDto req = new UpdateLinkRequestDto();
        req.setKey("NewKey");
        req.setUrl("https://new.url");

        sectionService.updateLink(5L, req);

        assertEquals("NewKey", link.getKey());
        assertEquals("https://new.url", link.getUrl());
        verify(linkItemRepository).save(link);
    }

    @Test
    void updateLink_whenNotFound_throwsBadRequest() {
        when(linkItemRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateLinkRequestDto req = new UpdateLinkRequestDto();
        req.setKey("k");

        assertThrows(BadRequestException.class, () -> sectionService.updateLink(99L, req));
    }

    // ─── deleteLink ──────────────────────────────────────────────────────────

    @Test
    void deleteLink_softDeletesLink() {
        Section section = buildSection(1L, "Links", SectionType.LINKS);
        LinkItem link = buildLinkItem(5L, "Docs", section);

        when(linkItemRepository.findById(5L)).thenReturn(Optional.of(link));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.deleteLink(5L);

        assertEquals(RecordStatus.DELETED, link.getStatus());
        verify(linkItemRepository).save(link);
    }

    @Test
    void deleteLink_whenNotFound_throwsBadRequest() {
        when(linkItemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> sectionService.deleteLink(99L));
    }

    // ─── reorderLinks ────────────────────────────────────────────────────────

    @Test
    void reorderLinks_updatesPositionsInOrder() {
        Section section = buildSection(1L, "Links", SectionType.LINKS);
        LinkItem a = buildLinkItem(10L, "A", section);
        LinkItem b = buildLinkItem(20L, "B", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(linkItemRepository.findBySectionIdAndStatusNot(1L, RecordStatus.DELETED))
            .thenReturn(List.of(a, b));

        sectionService.reorderLinks(1L, List.of(20L, 10L)); // B first, A second

        assertEquals(1, b.getPosition());
        assertEquals(2, a.getPosition());
        verify(linkItemRepository).saveAll(anyList());
    }

    // ─── addCalendarEvent ────────────────────────────────────────────────────

    @Test
    void addCalendarEvent_toCalendarSection_savesAndReturnsId() {
        Section section = buildSection(1L, "Calendar", SectionType.CALENDAR);
        CalendarEvent saved = buildCalendarEvent(9L, "Team meeting", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(calendarEventRepository.save(any(CalendarEvent.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        CreateCalendarEventRequestDto req = new CreateCalendarEventRequestDto();
        req.setTitle("Team meeting");
        req.setStartTime(java.time.LocalDateTime.now().plusDays(1));

        Long id = sectionService.addCalendarEvent(1L, req);

        assertEquals(9L, id);
        verify(calendarEventRepository).save(argThat(e -> "Team meeting".equals(e.getTitle())));
    }

    @Test
    void addCalendarEvent_withMemberIds_savesEventMembers() {
        Section section = buildSection(1L, "Calendar", SectionType.CALENDAR);
        CalendarEvent saved = buildCalendarEvent(9L, "Trip", section);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(calendarEventRepository.save(any(CalendarEvent.class))).thenReturn(saved);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        CreateCalendarEventRequestDto req = new CreateCalendarEventRequestDto();
        req.setTitle("Trip");
        req.setStartTime(java.time.LocalDateTime.now().plusDays(2));
        req.setMemberIds(List.of(1L, 2L));

        sectionService.addCalendarEvent(1L, req);

        verify(calendarEventMemberRepository).saveAll(any());
    }

    @Test
    void addCalendarEvent_toNonCalendarSection_throwsBadRequest() {
        Section section = buildSection(1L, "My List", SectionType.LIST);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreateCalendarEventRequestDto req = new CreateCalendarEventRequestDto();
        req.setTitle("Event");
        req.setStartTime(java.time.LocalDateTime.now());

        assertThrows(BadRequestException.class, () -> sectionService.addCalendarEvent(1L, req));
    }

    // ─── getCalendarEvents ───────────────────────────────────────────────────

    @Test
    void getCalendarEvents_returnsMappedEvents() {
        Section section = buildSection(1L, "Calendar", SectionType.CALENDAR);
        CalendarEvent event = buildCalendarEvent(1L, "Standup", section);
        CalendarEventDto dto = new CalendarEventDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(calendarEventRepository.findBySectionIdOrderByStartTimeAsc(1L)).thenReturn(List.of(event));
        when(calendarEventMemberRepository.findByEventIdIn(any())).thenReturn(Collections.emptyList());
        when(sectionMapper.toCalendarEventDto(event)).thenReturn(dto);

        var result = sectionService.getCalendarEvents(1L);

        assertEquals(1, result.size());
    }

    // ─── deleteCalendarEvent ─────────────────────────────────────────────────

    @Test
    void deleteCalendarEvent_deletesEventAndItsMembers() {
        Section section = buildSection(1L, "Calendar", SectionType.CALENDAR);
        CalendarEvent event = buildCalendarEvent(5L, "Stand-up", section);

        when(calendarEventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        sectionService.deleteCalendarEvent(5L);

        verify(calendarEventMemberRepository).deleteByEventId(5L);
        verify(calendarEventRepository).deleteById(5L);
    }

    @Test
    void deleteCalendarEvent_whenNotFound_throwsBadRequest() {
        when(calendarEventRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> sectionService.deleteCalendarEvent(99L));
    }

    // ─── updateCalendarEvent ─────────────────────────────────────────────────

    @Test
    void updateCalendarEvent_updatesFieldsAndSaves() {
        Section section = buildSection(1L, "Calendar", SectionType.CALENDAR);
        CalendarEvent event = buildCalendarEvent(5L, "Old Title", section);

        when(calendarEventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        UpdateCalendarEventRequestDto req = new UpdateCalendarEventRequestDto();
        req.setTitle("New Title");
        req.setLocation("Room 101");

        sectionService.updateCalendarEvent(5L, req);

        assertEquals("New Title", event.getTitle());
        assertEquals("Room 101", event.getLocation());
        verify(calendarEventRepository).save(event);
    }

    @Test
    void updateCalendarEvent_whenNotFound_throwsBadRequest() {
        when(calendarEventRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateCalendarEventRequestDto req = new UpdateCalendarEventRequestDto();
        req.setTitle("x");

        assertThrows(BadRequestException.class, () -> sectionService.updateCalendarEvent(99L, req));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Section buildSection(Long id, String title, SectionType type) {
        Section s = new Section();
        s.setId(id);
        s.setTitle(title);
        s.setType(type);
        s.setStatus(RecordStatus.ACTIVE);
        s.setGroupId(GROUP_ID);
        return s;
    }

    private ListItem buildListItem(Long id, String text, Section section) {
        ListItem item = new ListItem();
        item.setId(id);
        item.setText(text);
        item.setSection(section);
        item.setCompleted(false);
        item.setStatus(RecordStatus.ACTIVE);
        item.setGroupId(GROUP_ID);
        return item;
    }

    private Note buildNote(Long id, String content, Section section, int version) {
        Note note = new Note();
        note.setId(id);
        note.setContent(content);
        note.setSection(section);
        note.setVersion(version);
        note.setGroupId(GROUP_ID);
        return note;
    }

    private Reminder buildReminder(Long id, String title, Section section) {
        Reminder r = new Reminder();
        r.setId(id);
        r.setTitle(title);
        r.setSection(section);
        r.setSent(false);
        r.setStatus(RecordStatus.ACTIVE);
        r.setGroupId(GROUP_ID);
        return r;
    }

    private User buildUser() {
        User u = new User();
        u.setId(USER_ID);
        u.setFirstName("Test");
        u.setLastName("User");
        u.setEmail("user@example.com");
        return u;
    }

    private CalendarEvent buildCalendarEvent(Long id, String title, Section section) {
        CalendarEvent e = new CalendarEvent();
        e.setId(id);
        e.setTitle(title);
        e.setSection(section);
        e.setStartTime(java.time.LocalDateTime.now().plusDays(1));
        e.setGroupId(GROUP_ID);
        return e;
    }

    private LinkItem buildLinkItem(Long id, String key, Section section) {
        LinkItem link = new LinkItem();
        link.setId(id);
        link.setKey(key);
        link.setUrl("https://example.com");
        link.setSection(section);
        link.setStatus(RecordStatus.ACTIVE);
        link.setGroupId(GROUP_ID);
        return link;
    }
}
