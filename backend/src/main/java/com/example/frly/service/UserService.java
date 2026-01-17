package com.example.frly.service;

import com.example.frly.dto.RegisterUserDto;
import com.example.frly.dto.UserDto;
import com.example.frly.entity.User;
import com.example.frly.mapper.UserMapper;
import com.example.frly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;

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
}
