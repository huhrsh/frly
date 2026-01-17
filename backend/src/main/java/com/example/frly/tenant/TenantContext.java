package com.example.frly.tenant;

import lombok.extern.slf4j.Slf4j;

import static com.example.frly.constants.LogConstants.TENANT_CLEAR;
import static com.example.frly.constants.LogConstants.TENANT_GET;
import static com.example.frly.constants.LogConstants.TENANT_SET;

@Slf4j
public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setTenant(String tenant) {
        log.debug(TENANT_SET,tenant);
        currentTenant.set(tenant);
    }

    public static String getTenant() {
        String tenant = currentTenant.get();
        log.debug(TENANT_GET, tenant);
        return tenant;
    }

    public static void clear() {
        log.debug(TENANT_CLEAR);
        currentTenant.remove();
    }
}
