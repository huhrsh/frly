package com.example.frly.mapper;

import com.example.frly.dto.RegisterUserDto;
import com.example.frly.dto.UserDto;
import com.example.frly.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toUserDto(User user);

    User toUser(RegisterUserDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(RegisterUserDto dto, @MappingTarget User user);
}

