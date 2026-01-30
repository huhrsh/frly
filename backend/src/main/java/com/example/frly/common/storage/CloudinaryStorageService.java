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
        
        // Convert to Map for SDK
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "auto", // Detect image/video/raw
                        "use_filename", true,    // Use the original filename
                        "unique_filename", false // Keep the name as is (handle uniqueness via folder if needed, or let cloudinary append random if conflict? - actually better to keep unique_filename default true but use_filename true puts name in public_id)
                ));
        
        return uploadResult;
    }

    @Override
    public void deleteFile(String publicId) throws IOException {
        log.info("Deleting file from Cloudinary: {}", publicId);
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
