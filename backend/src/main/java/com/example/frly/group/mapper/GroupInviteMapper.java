package com.example.frly.group.mapper;

import com.example.frly.group.dto.GroupInviteSummaryDto;
import com.example.frly.group.model.GroupInviteToken;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GroupInviteMapper {

    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "groupDisplayName", source = "group.displayName")
    GroupInviteSummaryDto toGroupInviteSummaryDto(GroupInviteToken invite);
}

