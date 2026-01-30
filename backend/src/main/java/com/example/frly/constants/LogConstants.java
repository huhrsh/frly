package com.example.frly.constants;

public final class LogConstants {
    private LogConstants() {}

    // DataSourceConfig
    public static final String DATASOURCE_INIT = "Initializing TenantRoutingDataSource and registering config tenant datasource";
    public static final String DATASOURCE_REGISTER_CONFIG = "Config tenant datasource registered for {}";
    public static final String DATASOURCE_REGISTER_TENANT = "Registering tenant datasource";
    public static final String DATASOURCE_COMPLETE = "TenantRoutingDataSource initialization complete";

    // TenantContext
    public static final String TENANT_SET = "Setting tenant: {}";
    public static final String TENANT_GET = "Getting current tenant : {}";
    public static final String TENANT_CLEAR = "Clearing tenant context";

    // TenantContextFilter
    public static final String TENANT_FILTER_PROCESS = "Processing request for tenant";
    public static final String TENANT_FILTER_SET = "Tenant set in context";
    public static final String TENANT_FILTER_CLEAR = "Tenant context cleared after request";
    public static final String TENANT_FILTER_NO_ID = "No tenant ID found in request. Tenant context cleared.";

    // TenantRoutingDataSource
    public static final String ROUTE_TO_TENANT = "Routing to tenant datasource for tenant: {}";

    // UserService
    public static final String USER_CREATE_START = "Creating user";
    public static final String USER_CREATE_SUCCESS = "User created";
    public static final String USER_GET = "Fetching user";

    // UserController
    public static final String USER_CONTROLLER_CREATE_REQUEST = "Received create user request";
    public static final String USER_CONTROLLER_CREATE_SUCCESS = "User created in controller";
    public static final String USER_CONTROLLER_GET_REQUEST = "Received get user request id: {}";
    public static final String USER_CONTROLLER_GET_FOUND = "User found with id: {}";
    public static final String USER_CONTROLLER_GET_NOT_FOUND = "User not found with id: {}";

    // HealthController
    public static final String HEALTH_CHECK = "Health check endpoint called";

    // Tenant
    public static final String TENANT_CREATE_SUCCESS = "Tenant created";
    public static final String TENANT_CONTROLLER_CREATE = "Received create tenant request";

    // JWT
    public static final String JWT_GENERATE = "Generating JWT";
    public static final String JWT_INVALID = "Invalid JWT";
    public static final String AUTH_LOGIN_ATTEMPT = "Login attempt";
    public static final String AUTH_LOGIN_SUCCESS = "Login success";
    public static final String AUTH_LOGIN_FAILED = "Login failed";

    // Security
    public static final String SECURITY_ALERT_NO_ACCESS = "Security Alert: Access Denied";
    public static final String SECURITY_GROUP_ID_MISSING = "Security Alert: Group ID missing in context";

    // Note
    public static final String NOTE_CREATED = "Note created for section: {}";
    public static final String NOTE_UPDATED = "Note updated for section: {}";

    // Reminder
    public static final String REMINDER_CREATED = "Reminder created: {}";
}
