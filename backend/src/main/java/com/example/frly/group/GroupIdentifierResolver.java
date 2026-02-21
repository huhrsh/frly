package com.example.frly.group;

import com.example.frly.common.exception.BadRequestException;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class GroupIdentifierResolver implements CurrentTenantIdentifierResolver {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String groupId = GroupContext.getGroupId();
        return (groupId != null && !groupId.isEmpty()) ? groupId : "0";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
