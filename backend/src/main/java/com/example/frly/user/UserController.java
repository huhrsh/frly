package com.example.frly.user;

import com.example.frly.auth.dto.RegisterUserDto;
import com.example.frly.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final com.example.frly.group.service.GroupService groupService;

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody RegisterUserDto request) {
        log.info(USER_CONTROLLER_CREATE_REQUEST + ": " + request.getEmail());
        UserDto created = userService.createUser(request);
        log.info(USER_CONTROLLER_CREATE_SUCCESS + ": " + created.getId());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        log.info(USER_CONTROLLER_GET_REQUEST, id);
        return userService.getUserById(id)
                .map(userDto -> {
                    log.info(USER_CONTROLLER_GET_FOUND, id);
                    return ResponseEntity.ok(userDto);
                })
                .orElseGet(() -> {
                    log.warn(USER_CONTROLLER_GET_NOT_FOUND, id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        return userService.getCurrentUser(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(@RequestBody UserDto request) {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        UserDto updated = userService.updateCurrentUser(userId, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<UserDto> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        UserDto updated = userService.uploadAvatar(userId, file);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/me/groups")
    public ResponseEntity<java.util.List<com.example.frly.group.dto.GroupResponseDto>> getMyGroups() {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        return ResponseEntity.ok(groupService.getUserGroups(userId));
    }
}
