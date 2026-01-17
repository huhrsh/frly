package com.example.frly.controller;

import com.example.frly.dto.CreateTenantRequestDto;
import com.example.frly.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.example.frly.constants.LogConstants.TENANT_CONTROLLER_CREATE;

@Slf4j
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<String> createTenant(@RequestBody CreateTenantRequestDto request) {
        log.info(TENANT_CONTROLLER_CREATE + ": " + request.getDisplayName());
        String schemaName = tenantService.createTenant(request);
        return ResponseEntity.ok(schemaName);
    }
}

