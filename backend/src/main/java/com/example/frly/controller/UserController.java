package com.example.frly.controller;

import com.example.frly.dto.RegisterUserDto;
import com.example.frly.dto.UserDto;
import com.example.frly.service.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

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
}
