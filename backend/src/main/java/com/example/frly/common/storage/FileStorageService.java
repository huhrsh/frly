package com.example.frly.common.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

public interface FileStorageService {
    /**
     * Uploads a file and returns the result (url, public_id, etc.)
     * @param file The file to upload
     * @param folder The target folder/path
     * @return Map containing at least "secure_url" and "public_id"
     */
    Map<String, Object> uploadFile(MultipartFile file, String folder) throws IOException;

    /**
     * Deletes a file by public ID
     * @param publicId unique identifier of the file
     */
    void deleteFile(String publicId) throws IOException;

    /**
     * Generates an access URL for a stored object based on its public identifier.
     * Implementations may choose to sign the URL or apply provider-specific options.
     * @param publicId unique identifier of the file
     * @return an access URL that can be used by clients to retrieve the file
     */
    String generateAccessUrl(String publicId);
}
