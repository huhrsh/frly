package com.example.frly.section;

import com.example.frly.section.dto.*;
import com.example.frly.section.model.GalleryItem;
import com.example.frly.section.model.ListItem;
import com.example.frly.section.model.Note;
import com.example.frly.section.model.Reminder;
import com.example.frly.section.model.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Mapper(componentModel = "spring")
public interface SectionMapper {

    @Mapping(target = "parentId", source = "parentSection.id")
    SectionDto toSectionDto(Section section);

    ListItemDto toListItemDto(ListItem listItem);

    @Mapping(target = "sectionId", source = "section.id")
    NoteDto toNoteDto(Note note);

    @Mapping(target = "isSent", source = "sent")
    ReminderDto toReminderDto(Reminder reminder);

    @Mapping(target = "sectionId", source = "section.id")
    GalleryItemDto toGalleryItemDto(GalleryItem item);

    default LocalDateTime map(Instant value) {
        return value == null ? null : LocalDateTime.ofInstant(value, ZoneId.systemDefault());
    }
}
