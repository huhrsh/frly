package com.example.frly.user;

import com.example.frly.auth.AuthUtil;
import com.example.frly.auth.dto.RegisterUserDto;
import com.example.frly.common.storage.FileStorageService;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.section.repository.SectionRepository;
import com.example.frly.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private static final long DEMO_GROUP_ID = 10L;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final RoleRepository roleRepository;
    private final SectionRepository sectionRepository;

    public UserDto createUser(RegisterUserDto registerUserDto) {
        log.info(USER_CREATE_START + ": " + registerUserDto.getEmail());
        User user = userMapper.toUser(registerUserDto);
        user.setEncryptedPassword(passwordEncoder.encode(registerUserDto.getPassword()));
        User saved = userRepository.save(user);
        log.info(USER_CREATE_SUCCESS + ": " + saved.getId());
        addToDemoGroup(saved);
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
        if (updated.getFontPreference() != null) {
            user.setFontPreference(updated.getFontPreference());
        }

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

    public UserDto deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPfpUrl(null);
        User saved = userRepository.save(user);
        return userMapper.toUserDto(saved);
    }

    public void addToDemoGroup(User user) {
        try {
            Group demoGroup = groupRepository.findById(DEMO_GROUP_ID).orElse(null);
            if (demoGroup == null) return;
            boolean alreadyMember = groupMemberRepository.findByUserId(user.getId())
                    .stream().anyMatch(m -> m.getGroup().getId().equals(DEMO_GROUP_ID));
            if (alreadyMember) return;
            Role memberRole = roleRepository.findByName("MEMBER").orElse(null);
            if (memberRole == null) return;
            GroupMember member = new GroupMember();
            member.setGroup(demoGroup);
            member.setUser(user);
            member.setRole(memberRole);
            member.setStatus(GroupMemberStatus.APPROVED);
            groupMemberRepository.save(member);
            log.info("Auto-added new user {} to demo group {}", user.getId(), DEMO_GROUP_ID);
        } catch (Exception e) {
            log.warn("Failed to add user {} to demo group: {}", user.getId(), e.getMessage());
        }
    }

    public OnboardingStatusDto getOnboardingStatus() {
        Long userId = AuthUtil.getCurrentUserId();

        List<GroupMember> approved = groupMemberRepository.findByUserId(userId)
                .stream()
                .filter(m -> m.getStatus() == GroupMemberStatus.APPROVED)
                .filter(m -> !m.getGroup().getId().equals(DEMO_GROUP_ID))
                .toList();

        boolean hasGroup = !approved.isEmpty();

        boolean hasSection = approved.stream()
                .anyMatch(m -> sectionRepository.existsByGroupId(String.valueOf(m.getGroup().getId())));

        boolean hasMember = approved.stream()
                .anyMatch(m -> groupMemberRepository.countByGroupIdAndStatus(
                        m.getGroup().getId(), GroupMemberStatus.APPROVED) >= 2);

        return new OnboardingStatusDto(hasGroup, hasSection, hasMember);
    }
}
