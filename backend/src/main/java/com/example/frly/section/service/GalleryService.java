package com.example.frly.section.service;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.common.exception.StorageLimitExceededException;
import com.example.frly.common.storage.FileStorageService;
import com.example.frly.group.GroupContext;
import com.example.frly.group.model.Group;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.service.GroupService;
import com.example.frly.section.SectionMapper;
import com.example.frly.section.dto.GalleryItemDto;
import com.example.frly.section.model.GalleryItem;
import com.example.frly.section.model.Section;
import com.example.frly.section.model.SectionType;
import com.example.frly.section.repository.GalleryItemRepository;
import com.example.frly.section.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryItemRepository galleryItemRepository;
    private final SectionRepository sectionRepository;
    private final GroupRepository groupRepository;
    private final GroupService groupService;
    private final FileStorageService fileStorageService;
    private final SectionService sectionService; // Inject SectionService for password validation
    private final SectionMapper sectionMapper;

    @Transactional
    public GalleryItemDto uploadItem(Long sectionId, MultipartFile file) throws IOException {
        // 1. Security Check
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        // 2. Validate Section
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == com.example.frly.common.enums.RecordStatus.DELETED) {
            throw new BadRequestException("Section is deleted");
        }
        if (section.getType() != SectionType.GALLERY) {
            throw new BadRequestException("Section is not a Gallery");
        }

        // 3. Check Storage Limit
        long fileSize = file.getSize();
        Long groupId = Long.parseLong(GroupContext.getGroupId());
        
        // Lock group row for update to prevent race conditions roughly (or just pessimistic write)
        // For simple MVP we just fetch.
        Group group = groupRepository.findById(groupId).orElseThrow();
        
        if (group.getStorageUsage() + fileSize > group.getStorageLimit()) {
            throw new StorageLimitExceededException("Group storage limit exceeded (" + (group.getStorageLimit() / 1024 / 1024) + "MB)");
        }

        // 4. Upload to Cloudinary
        // Folder structure: fryly/tenant_{groupId}/section_{sectionId}
        String folderPath = "fryly/tenant_" + groupId + "/section_" + sectionId;
        Map<String, Object> uploadResult = fileStorageService.uploadFile(file, folderPath);

        // 5. Create Entity
        GalleryItem item = new GalleryItem();
        item.setSection(section);
        item.setTitle(file.getOriginalFilename()); // Default title
        item.setOriginalFilename(file.getOriginalFilename());
        item.setContentType(file.getContentType());
        item.setFileSize(fileSize);
        
        item.setUrl((String) uploadResult.get("secure_url"));
        item.setPublicId((String) uploadResult.get("public_id"));

        galleryItemRepository.save(item);

        // 6. Update Usage
        group.setStorageUsage(group.getStorageUsage() + fileSize);
        groupRepository.save(group);

        log.info("Uploaded gallery item {} ({}) for group {}", item.getId(), fileSize, groupId);

        GalleryItemDto dto = sectionMapper.toGalleryItemDto(item);
        dto.setUrl(fileStorageService.generateAccessUrl(item.getPublicId()));
        return dto;
    }

    public Page<GalleryItemDto> getItems(Long sectionId, Pageable pageable) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == com.example.frly.common.enums.RecordStatus.DELETED) {
            return Page.empty(pageable);
        }

        return galleryItemRepository
                .findBySectionIdAndStatusNotOrderByCreatedAtDesc(sectionId, com.example.frly.common.enums.RecordStatus.DELETED, pageable)
                .map(item -> {
                    GalleryItemDto dto = sectionMapper.toGalleryItemDto(item);
                    dto.setUrl(fileStorageService.generateAccessUrl(item.getPublicId()));
                    return dto;
                });
    }

    public long getItemCount(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == com.example.frly.common.enums.RecordStatus.DELETED) {
            return 0L;
        }
        return galleryItemRepository.countBySectionIdAndStatusNot(sectionId, com.example.frly.common.enums.RecordStatus.DELETED);
    }

    @Transactional
    public void deleteItem(Long itemId) throws IOException {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        
        GalleryItem item = galleryItemRepository.findById(itemId)
                .orElseThrow(() -> new BadRequestException("Item not found"));
        
        Long fileSize = item.getFileSize();
        Long groupId = Long.parseLong(GroupContext.getGroupId());

        // 1. Delete from Storage
        fileStorageService.deleteFile(item.getPublicId());

        // 2. Soft-delete Entity (keep record, free storage)
        item.setStatus(com.example.frly.common.enums.RecordStatus.DELETED);
        galleryItemRepository.save(item);

        // 3. Update Usage (Decrement)
        Group group = groupRepository.findById(groupId).orElseThrow();
        long newUsage = Math.max(0, group.getStorageUsage() - fileSize);
        group.setStorageUsage(newUsage);
        groupRepository.save(group);

        log.info("Deleted gallery item {} and freed {} bytes", itemId, fileSize);
    }

    @Transactional
    public void renameItem(Long itemId, String newTitle) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        GalleryItem item = galleryItemRepository.findById(itemId)
                .orElseThrow(() -> new BadRequestException("Item not found"));
        item.setTitle(newTitle);
        galleryItemRepository.save(item);
    }

    public String getItemAccessUrl(Long itemId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        GalleryItem item = galleryItemRepository.findById(itemId)
                .orElseThrow(() -> new BadRequestException("Item not found"));

        Section section = item.getSection();
        if (section == null || section.getStatus() == com.example.frly.common.enums.RecordStatus.DELETED) {
            throw new BadRequestException("Section is deleted");
        }

        return fileStorageService.generateAccessUrl(item.getPublicId());
    }
}
