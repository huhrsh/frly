package com.example.frly.service;

import com.example.frly.dto.CreateTenantRequestDto;
import com.example.frly.entity.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public String createTenant(CreateTenantRequestDto request) {

        // 0. Get user id
        Long userId = AuthUtil.getCurrentUserId();

        // 1. Generate schema name
        Long seq = jdbcTemplate.queryForObject(
                "SELECT nextval('config.tenant_registry_id_seq')",
                Long.class
        );
        String schemaName = "frly_" + seq;

        // 2. Insert tenant registry and get tenant_id
        Long tenantId = jdbcTemplate.queryForObject(
                "INSERT INTO config.tenant_registry (display_name, schema_name) " +
                        "VALUES (?, ?) RETURNING id",
                Long.class,
                request.getDisplayName(),
                schemaName
        );

        // 3. Create schema
        jdbcTemplate.execute("CREATE SCHEMA \"" + schemaName + "\"");

        // 4. Run Flyway migrations for tenant schema
        Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        // 5. Assign creator role (role_id = 1) to user for this tenant
        jdbcTemplate.update(
                "INSERT INTO config.user_tenant_roles (user_id, tenant_id, role_id) VALUES (?, ?, ?)",
                userId,
                tenantId,
                1L
        );

        log.info("Tenant created successfully: {}, tenantId={}", schemaName, tenantId);
        return schemaName;
    }

}
