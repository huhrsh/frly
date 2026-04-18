package com.example.frly.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements FileStorageService {

    private final Cloudinary cloudinary;

    @Override
    public Map<String, Object> uploadFile(MultipartFile file, String folder) throws IOException {
        log.info("Uploading file to Cloudinary path: {}", folder);
        
        // Decide whether this is a gallery/document upload (tenant-scoped) or something else (e.g. avatar).
        // Gallery uploads use the dedicated signed preset configured in Cloudinary.
        boolean isGalleryUpload = folder != null && folder.contains("tenant_");

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "auto", // Detect image/video/raw
                // Use the original filename for readability, while keeping
                // Cloudinary's unique public IDs so uploads with the same
                // name do not overwrite each other.
                "use_filename", true,
                "unique_filename", true,
                // For gallery/doc uploads we rely on the `gallery_docs_private`
                // preset created in Cloudinary (signed + authenticated delivery).
                // The preset's folder (e.g. "fryly") combines with this "folder"
                // argument to produce paths like "fryly/tenant_1/section_2/...".
                "upload_preset", isGalleryUpload ? "gallery_docs_private" : null
            ));

        return uploadResult;
    }

    @Override
    public void deleteFile(String publicId) throws IOException {
        log.info("Deleting file from Cloudinary: {}", publicId);
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    @Override
    public String generateAccessUrl(String publicId) {
        return generateAccessUrl(publicId, null);
    }

    @Override
    public String generateAccessUrl(String publicId, String contentType) {
        boolean isGalleryAsset = publicId != null && publicId.contains("/tenant_");
        String resourceType = toCloudinaryResourceType(contentType);

        return cloudinary.url()
            .secure(true)
            .resourceType(resourceType)
            .type(isGalleryAsset ? "authenticated" : "upload")
            .signed(isGalleryAsset)
            .generate(publicId);
    }

    private String toCloudinaryResourceType(String contentType) {
        if (contentType == null) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("image/")) return "image";
        return "raw";
    }
}
