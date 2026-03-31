package com.example.frly.user;

import com.example.frly.auth.dto.RegisterUserDto;
import com.example.frly.common.storage.FileStorageService;
import com.example.frly.user.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private UserService userService;

    // ─── createUser ──────────────────────────────────────────────────────────

    @Test
    void createUser_savesUserWithHashedPassword() {
        RegisterUserDto dto = new RegisterUserDto("Jane", "Doe", "jane@example.com", "password123");
        User userEntity = buildUser(null, "jane@example.com");
        User savedUser  = buildUser(1L,   "jane@example.com");
        UserDto userDto = new UserDto(1L, "Jane", "Doe", "jane@example.com", null, null, true, null);

        when(userMapper.toUser(dto)).thenReturn(userEntity);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(userEntity)).thenReturn(savedUser);
        when(userMapper.toUserDto(savedUser)).thenReturn(userDto);

        UserDto result = userService.createUser(dto);

        assertEquals("jane@example.com", result.getEmail());
        assertEquals("hashed", userEntity.getEncryptedPassword());
        verify(userRepository).save(userEntity);
    }

    @Test
    void createUser_neverStoresRawPassword() {
        RegisterUserDto dto = new RegisterUserDto("Jane", "Doe", "jane@example.com", "plain");
        User userEntity = buildUser(null, "jane@example.com");

        when(userMapper.toUser(dto)).thenReturn(userEntity);
        when(passwordEncoder.encode("plain")).thenReturn("bcrypt-hash");
        when(userRepository.save(userEntity)).thenReturn(userEntity);
        when(userMapper.toUserDto(any())).thenReturn(new UserDto());

        userService.createUser(dto);

        assertNotEquals("plain", userEntity.getEncryptedPassword(),
            "Raw password must never be stored");
    }

    // ─── getUserById ─────────────────────────────────────────────────────────

    @Test
    void getUserById_whenFound_returnsDto() {
        User user = buildUser(1L, "test@example.com");
        UserDto dto = new UserDto(1L, "Test", "User", "test@example.com", null, null, true, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userMapper.toUserDto(user)).thenReturn(dto);

        Optional<UserDto> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    void getUserById_whenNotFound_returnsEmpty() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<UserDto> result = userService.getUserById(99L);

        assertTrue(result.isEmpty());
    }

    // ─── updateCurrentUser ───────────────────────────────────────────────────

    @Test
    void updateCurrentUser_whenUserNotFound_throwsRuntimeException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> userService.updateCurrentUser(99L, new UserDto()));
    }

    @Test
    void updateCurrentUser_updatesAllEditableFields() {
        User user = buildUser(1L, "old@example.com");
        UserDto updates = new UserDto(1L, "NewFirst", "NewLast", "old@example.com",
            "555-1234", null, false, "large");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toUserDto(user)).thenReturn(updates);

        userService.updateCurrentUser(1L, updates);

        assertEquals("NewFirst", user.getFirstName());
        assertEquals("NewLast", user.getLastName());
        assertEquals("555-1234", user.getContact());
        assertFalse(user.isReminderEmailEnabled());
        assertEquals("large", user.getFontPreference());
    }

    @Test
    void updateCurrentUser_whenFontPreferenceIsNull_doesNotOverwrite() {
        User user = buildUser(1L, "test@example.com");
        user.setFontPreference("small");

        UserDto updates = new UserDto(1L, "A", "B", "test@example.com",
            null, null, true, null); // fontPreference is null

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toUserDto(user)).thenReturn(updates);

        userService.updateCurrentUser(1L, updates);

        assertEquals("small", user.getFontPreference(),
            "Null fontPreference in update must not overwrite existing value");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User buildUser(Long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFirstName("Test");
        u.setLastName("User");
        u.setEncryptedPassword("hashed");
        return u;
    }
}
