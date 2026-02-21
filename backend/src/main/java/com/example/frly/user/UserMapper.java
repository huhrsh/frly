package com.example.frly.user;

import com.example.frly.auth.dto.RegisterUserDto;
import com.example.frly.user.dto.UserDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toUserDto(User user);

    User toUser(RegisterUserDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(RegisterUserDto dto, @MappingTarget User user);
}

