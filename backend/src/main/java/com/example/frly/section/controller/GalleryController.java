package com.example.frly.section.controller;

import com.example.frly.section.dto.GalleryItemDto;
import com.example.frly.section.model.GalleryItem;
import com.example.frly.section.service.GalleryService;
import com.example.frly.section.SectionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups/sections")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;
    private final SectionMapper sectionMapper;

    @PostMapping(value = "/{sectionId}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GalleryItemDto> uploadFile(@PathVariable Long sectionId, 
                                                     @RequestParam("file") MultipartFile file) throws IOException {
        GalleryItem item = galleryService.uploadItem(sectionId, file);
        return ResponseEntity.ok(sectionMapper.toGalleryItemDto(item));
    }

    @GetMapping("/{sectionId}/gallery")
    public ResponseEntity<List<GalleryItemDto>> getGalleryItems(@PathVariable Long sectionId) {
        List<GalleryItem> items = galleryService.getItems(sectionId);
        return ResponseEntity.ok(items.stream()
                .map(sectionMapper::toGalleryItemDto)
                .collect(Collectors.toList()));
    }

    @DeleteMapping("/gallery/{itemId}")
    public ResponseEntity<Void> deleteGalleryItem(@PathVariable Long itemId) throws IOException {
        galleryService.deleteItem(itemId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/gallery/{itemId}")
    public ResponseEntity<Void> renameGalleryItem(@PathVariable Long itemId, @RequestBody java.util.Map<String, String> payload) {
        String newTitle = payload.get("title");
        if (newTitle == null || newTitle.isBlank()) {
             return ResponseEntity.badRequest().build();
        }
        galleryService.renameItem(itemId, newTitle);
        return ResponseEntity.ok().build();
    }
}
