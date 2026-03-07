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
        // Centralized place to construct delivery URLs for stored assets.
        // Gallery/documents are stored using the `gallery_docs_private` preset
        // and should be served via the `authenticated` delivery type. Avatars
        // and other public assets continue to use the default `upload` type.

        boolean isGalleryAsset = publicId != null && publicId.contains("/tenant_");

        return cloudinary.url()
            .secure(true)
            .type(isGalleryAsset ? "authenticated" : "upload")
            .signed(isGalleryAsset)
            .generate(publicId);
    }
}
