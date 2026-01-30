package com.example.frly.group;

import lombok.extern.slf4j.Slf4j;

import static com.example.frly.constants.LogConstants.TENANT_CLEAR;
import static com.example.frly.constants.LogConstants.TENANT_GET;
import static com.example.frly.constants.LogConstants.TENANT_SET;

@Slf4j
public class GroupContext {
    private static final ThreadLocal<String> currentGroup = new ThreadLocal<>();

    public static void setGroupId(String groupId) {
        log.debug(TENANT_SET, groupId);
        currentGroup.set(groupId);
    }

    public static String getGroupId() {
        String groupId = currentGroup.get();
        log.debug(TENANT_GET, groupId);
        return groupId;
    }

    public static void clear() {
        log.debug(TENANT_CLEAR);
        currentGroup.remove();
    }
}
