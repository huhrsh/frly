package com.example.frly.section;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.common.exception.StorageLimitExceededException;
import com.example.frly.common.storage.FileStorageService;
import com.example.frly.group.GroupContext;
import com.example.frly.group.model.Group;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.service.GroupService;
import com.example.frly.notification.NotificationService;
import com.example.frly.section.SectionMapper;
import com.example.frly.section.dto.GalleryItemDto;
import com.example.frly.section.model.GalleryItem;
import com.example.frly.section.model.Section;
import com.example.frly.section.model.SectionType;
import com.example.frly.section.repository.GalleryItemRepository;
import com.example.frly.section.repository.SectionRepository;
import com.example.frly.section.service.GalleryService;
import com.example.frly.section.service.SectionService;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GalleryServiceTest {

    @Mock private GalleryItemRepository galleryItemRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupService groupService;
    @Mock private FileStorageService fileStorageService;
    @Mock private SectionService sectionService;
    @Mock private SectionMapper sectionMapper;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private GalleryService galleryService;

    private static final Long USER_ID = 10L;
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

    // ─── uploadItem ───────────────────────────────────────────────────────────

    @Test
    void uploadItem_success_savesItemAndUpdatesGroupStorage() throws IOException {
        Section section = buildGallerySection(1L);
        Group group = buildGroup(1L, 0L, 100 * 1024 * 1024L); // 0 used, 100MB limit
        GalleryItemDto dto = new GalleryItemDto();

        MultipartFile file = mock(MultipartFile.class);
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("photo.jpg");
        when(file.getContentType()).thenReturn("image/jpeg");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(fileStorageService.uploadFile(eq(file), any()))
            .thenReturn(Map.of("secure_url", "https://cdn.example.com/photo.jpg", "public_id", "pub/photo"));
        when(galleryItemRepository.save(any(GalleryItem.class))).thenAnswer(inv -> {
            GalleryItem item = inv.getArgument(0);
            item.setId(42L);
            return item;
        });
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
        when(sectionMapper.toGalleryItemDto(any(GalleryItem.class))).thenReturn(dto);
        when(fileStorageService.generateAccessUrl(any())).thenReturn("https://cdn.example.com/photo.jpg");

        GalleryItemDto result = galleryService.uploadItem(1L, file);

        assertNotNull(result);
        assertEquals(1024L, group.getStorageUsage()); // storage incremented
        verify(galleryItemRepository).save(any(GalleryItem.class));
        verify(groupRepository).save(group);
    }

    @Test
    void uploadItem_whenStorageLimitExceeded_throwsStorageLimitException() throws IOException {
        Section section = buildGallerySection(1L);
        Group group = buildGroup(1L, 99 * 1024 * 1024L, 100 * 1024 * 1024L); // 99MB used, 100MB limit

        MultipartFile file = mock(MultipartFile.class);
        when(file.getSize()).thenReturn(2 * 1024 * 1024L); // 2MB file won't fit

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThrows(StorageLimitExceededException.class, () -> galleryService.uploadItem(1L, file));
        verify(fileStorageService, never()).uploadFile(any(), any());
    }

    @Test
    void uploadItem_toNonGallerySection_throwsBadRequest() throws IOException {
        Section listSection = new Section();
        listSection.setId(1L);
        listSection.setType(SectionType.LIST);
        listSection.setStatus(RecordStatus.ACTIVE);
        listSection.setGroupId(GROUP_ID);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(listSection));

        // file.getSize() is called AFTER the section-type check, so do not stub it here
        MultipartFile file = mock(MultipartFile.class);

        assertThrows(BadRequestException.class, () -> galleryService.uploadItem(1L, file));
    }

    // ─── deleteItem ───────────────────────────────────────────────────────────

    @Test
    void deleteItem_softDeletesItemAndDecrementsGroupStorage() throws IOException {
        Section section = buildGallerySection(1L);
        Group group = buildGroup(1L, 2048L, 100 * 1024 * 1024L);

        GalleryItem item = buildGalleryItem(5L, section, 1024L, "pub/photo");

        when(galleryItemRepository.findById(5L)).thenReturn(Optional.of(item));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));

        galleryService.deleteItem(5L);

        assertEquals(RecordStatus.DELETED, item.getStatus());
        assertEquals(1024L, group.getStorageUsage()); // 2048 - 1024 = 1024
        verify(fileStorageService).deleteFile("pub/photo");
        verify(galleryItemRepository).save(item);
        verify(groupRepository).save(group);
    }

    @Test
    void deleteItem_whenNotFound_throwsBadRequest() {
        when(galleryItemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> galleryService.deleteItem(99L));
    }

    // ─── renameItem ───────────────────────────────────────────────────────────

    @Test
    void renameItem_updatesTitle() {
        Section section = buildGallerySection(1L);
        GalleryItem item = buildGalleryItem(3L, section, 512L, "pub/img");

        when(galleryItemRepository.findById(3L)).thenReturn(Optional.of(item));

        galleryService.renameItem(3L, "Vacation 2025");

        assertEquals("Vacation 2025", item.getTitle());
        verify(galleryItemRepository).save(item);
    }

    @Test
    void renameItem_whenNotFound_throwsBadRequest() {
        when(galleryItemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> galleryService.renameItem(99L, "new name"));
    }

    // ─── getItemCount ─────────────────────────────────────────────────────────

    @Test
    void getItemCount_returnsCountFromRepository() {
        Section section = buildGallerySection(1L);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(galleryItemRepository.countBySectionIdAndStatusNot(1L, RecordStatus.DELETED)).thenReturn(7L);

        long count = galleryService.getItemCount(1L);

        assertEquals(7L, count);
    }

    @Test
    void getItemCount_forDeletedSection_returnsZero() {
        Section section = buildGallerySection(1L);
        section.setStatus(RecordStatus.DELETED);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        long count = galleryService.getItemCount(1L);

        assertEquals(0L, count);
        verify(galleryItemRepository, never()).countBySectionIdAndStatusNot(any(), any());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Section buildGallerySection(Long id) {
        Section s = new Section();
        s.setId(id);
        s.setTitle("Gallery");
        s.setType(SectionType.GALLERY);
        s.setStatus(RecordStatus.ACTIVE);
        s.setGroupId(GROUP_ID);
        return s;
    }

    private Group buildGroup(Long id, long storageUsed, long storageLimit) {
        Group g = new Group();
        g.setId(id);
        g.setStorageUsage(storageUsed);
        g.setStorageLimit(storageLimit);
        return g;
    }

    private GalleryItem buildGalleryItem(Long id, Section section, Long fileSize, String publicId) {
        GalleryItem item = new GalleryItem();
        item.setId(id);
        item.setSection(section);
        item.setFileSize(fileSize);
        item.setPublicId(publicId);
        item.setOriginalFilename("photo.jpg");
        item.setStatus(RecordStatus.ACTIVE);
        item.setGroupId(GROUP_ID);
        return item;
    }

    private User buildUser() {
        User u = new User();
        u.setId(USER_ID);
        u.setFirstName("Test");
        u.setLastName("User");
        u.setEmail("user@example.com");
        return u;
    }
}
