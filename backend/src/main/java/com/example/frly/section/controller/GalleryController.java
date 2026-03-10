package com.example.frly.section.controller;

import com.example.frly.section.dto.GalleryItemDto;
import com.example.frly.section.service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.springframework.data.domain.Sort.Direction.DESC;

@RestController
@RequestMapping("/api/groups/sections")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @PostMapping(value = "/{sectionId}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GalleryItemDto> uploadFile(@PathVariable Long sectionId, 
                                                     @RequestParam("file") MultipartFile file) throws IOException {
        GalleryItemDto item = galleryService.uploadItem(sectionId, file);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/{sectionId}/gallery")
    public ResponseEntity<Page<GalleryItemDto>> getGalleryItems(
            @PathVariable Long sectionId,
            @PageableDefault(size = 25, sort = "createdAt", direction = DESC) Pageable pageable) {
        Page<GalleryItemDto> page = galleryService.getItems(sectionId, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{sectionId}/gallery/count")
    public ResponseEntity<Long> getGalleryItemCount(@PathVariable Long sectionId) {
        long count = galleryService.getItemCount(sectionId);
        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/gallery/{itemId}")
    public ResponseEntity<Void> deleteGalleryItem(@PathVariable Long itemId) throws IOException {
        galleryService.deleteItem(itemId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/gallery/{itemId}")
    public ResponseEntity<Void> renameGalleryItem(@PathVariable Long itemId, @RequestBody Map<String, String> payload) {
        String newTitle = payload.get("title");
        if (newTitle == null || newTitle.isBlank()) {
             return ResponseEntity.badRequest().build();
        }
        galleryService.renameItem(itemId, newTitle);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/gallery/{itemId}/download")
    public ResponseEntity<Map<String, String>> getGalleryItemDownloadUrl(@PathVariable Long itemId) {
        String url = galleryService.getItemAccessUrl(itemId);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
