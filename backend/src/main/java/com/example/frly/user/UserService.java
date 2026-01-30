package com.example.frly.user;

import com.example.frly.auth.dto.RegisterUserDto;
import com.example.frly.common.storage.FileStorageService;
import com.example.frly.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public UserDto createUser(RegisterUserDto registerUserDto) {
        log.info(USER_CREATE_START + ": " + registerUserDto.getEmail());
        User user = userMapper.toUser(registerUserDto);
        user.setEncryptedPassword(passwordEncoder.encode(registerUserDto.getPassword()));
        User saved = userRepository.save(user);
        log.info(USER_CREATE_SUCCESS + ": " + saved.getId());
        return userMapper.toUserDto(saved);
    }

    public Optional<UserDto> getUserById(Long id) {
        log.info(USER_GET + ": " + id);
        return userRepository.findById(id).map(userMapper::toUserDto);
    }

    public Optional<UserDto> getCurrentUser(Long userId) {
        log.info(USER_GET + ": " + userId);
        return userRepository.findById(userId).map(userMapper::toUserDto);
    }

    public UserDto updateCurrentUser(Long userId, UserDto updated) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(updated.getFirstName());
        user.setLastName(updated.getLastName());
        user.setContact(updated.getContact());
        user.setPfpUrl(updated.getPfpUrl());
        user.setReminderEmailEnabled(updated.isReminderEmailEnabled());

        User saved = userRepository.save(user);
        return userMapper.toUserDto(saved);
    }

    public UserDto uploadAvatar(Long userId, MultipartFile file) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Store avatar under a simple folder per user
            String folderPath = "avatars/user_" + userId;
            java.util.Map<String, Object> uploadResult = fileStorageService.uploadFile(file, folderPath);
            String url = (String) uploadResult.get("secure_url");

            user.setPfpUrl(url);
            User saved = userRepository.save(user);
            return userMapper.toUserDto(saved);
        } catch (Exception e) {
            log.error("Failed to upload avatar for user {}", userId, e);
            throw new RuntimeException("Failed to upload avatar", e);
        }
    }
}
