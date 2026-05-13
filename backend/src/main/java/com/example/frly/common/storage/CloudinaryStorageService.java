package com.example.frly.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
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

        boolean isGalleryUpload = folder != null && folder.contains("tenant_");

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "auto",
                "use_filename", true,
                "unique_filename", true,
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

    @Override
    public String generateDownloadUrl(String publicId, String contentType, String filename) {
        boolean isGalleryAsset = publicId != null && publicId.contains("/tenant_");
        String resourceType = toCloudinaryResourceType(contentType);

        String attachmentFlag = "attachment";
        if (filename != null && !filename.isBlank()) {
            // Sanitize: keep alphanumerics, dots, hyphens; replace everything else with underscore
            String safe = filename.replaceAll("[^A-Za-z0-9._\\-]", "_");
            // Cloudinary fl_attachment expects base name WITHOUT extension — it appends the correct
            // extension automatically based on the resource format. Including the extension here
            // would result in a doubled extension (e.g. "file.png.png").
            int dotIdx = safe.lastIndexOf('.');
            String baseName = dotIdx > 0 ? safe.substring(0, dotIdx) : safe;
            attachmentFlag = "attachment:" + baseName;
        }

        return cloudinary.url()
            .secure(true)
            .resourceType(resourceType)
            .type(isGalleryAsset ? "authenticated" : "upload")
            .signed(isGalleryAsset)
            .transformation(new Transformation().flags(attachmentFlag))
            .generate(publicId);
    }

    private String toCloudinaryResourceType(String contentType) {
        if (contentType == null) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("image/")) return "image";
        // Cloudinary uploads PDFs with resource_type=auto as "image" (it can render
        // PDF pages). Generating a URL with "raw" would produce a broken /raw/ path.
        if (contentType.equals("application/pdf")) return "image";
        return "raw";
    }
}
