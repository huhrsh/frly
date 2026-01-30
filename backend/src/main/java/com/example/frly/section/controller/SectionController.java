package com.example.frly.section.controller;

import com.example.frly.section.dto.*;
import com.example.frly.section.service.SectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/groups/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    // --- SECTIONS ---

    @PostMapping
    public ResponseEntity<Long> createSection(@RequestBody CreateSectionRequestDto request) {
        Long sectionId = sectionService.createSection(request);
        return ResponseEntity.ok(sectionId);
    }

    @GetMapping
    public ResponseEntity<List<SectionDto>> getSections() {
        return ResponseEntity.ok(sectionService.getSections());
    }

    // --- LIST ITEMS ---

    @PostMapping("/{sectionId}/items")
    public ResponseEntity<Long> addListItem(@PathVariable Long sectionId, @RequestBody CreateListItemRequestDto request) {
        Long itemId = sectionService.addListItem(sectionId, request);
        return ResponseEntity.ok(itemId);
    }

    @GetMapping("/{sectionId}/items")
    public ResponseEntity<List<ListItemDto>> getListItems(@PathVariable Long sectionId) {
        return ResponseEntity.ok(sectionService.getListItems(sectionId));
    }

    @PatchMapping("/items/{itemId}/toggle")
    public ResponseEntity<Void> toggleListItem(@PathVariable Long itemId) {
        sectionService.toggleListItem(itemId);
        return ResponseEntity.ok().build();
    }

    // --- NOTES ---

    @GetMapping("/{sectionId}/note")
    public ResponseEntity<com.example.frly.section.dto.NoteDto> getNote(@PathVariable Long sectionId) {
        return ResponseEntity.ok(sectionService.getNote(sectionId));
    }

    @PutMapping("/{sectionId}/note")
    public ResponseEntity<?> updateNote(@PathVariable Long sectionId,
                                        @RequestBody UpdateNoteRequestDto request) {
        try {
            NoteDto updated = sectionService.updateNote(sectionId, request);
            return ResponseEntity.ok(updated);
        } catch (jakarta.persistence.OptimisticLockException ex) {
            NoteDto latest = sectionService.getNote(sectionId);
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("code", "NOTE_CONFLICT");
            body.put("message", "This note was updated by someone else. Please review the latest version.");
            body.put("latestNote", latest);
            return ResponseEntity.status(409).body(body);
        }
    }

    // --- REMINDERS ---

    @PostMapping("/{sectionId}/reminders")
    public ResponseEntity<Long> addReminder(@PathVariable Long sectionId, @RequestBody com.example.frly.section.dto.CreateReminderRequestDto request) {
        Long reminderId = sectionService.addReminder(sectionId, request);
        return ResponseEntity.ok(reminderId);
    }

    @GetMapping("/{sectionId}/reminders")
    public ResponseEntity<List<ReminderDto>> getReminders(@PathVariable Long sectionId) {
        return ResponseEntity.ok(sectionService.getReminders(sectionId));
    }

    @DeleteMapping("/reminders/{reminderId}")
    public ResponseEntity<Void> deleteReminder(@PathVariable Long reminderId) {
        sectionService.deleteReminder(reminderId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reminders/{reminderId}")
    public ResponseEntity<Void> updateReminder(@PathVariable Long reminderId,
                                               @RequestBody com.example.frly.section.dto.UpdateReminderRequestDto request) {
        sectionService.updateReminder(reminderId, request);
        return ResponseEntity.ok().build();
    }

}
