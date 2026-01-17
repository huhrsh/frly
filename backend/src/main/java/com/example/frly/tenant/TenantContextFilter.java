package com.example.frly.tenant;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

import static com.example.frly.constants.LogConstants.*;

/**
 * Filter to extract tenant identifier from each request and store in TenantContext.
 * Example: expects X-Tenant-ID header in each request.
 */
@Slf4j
@Component
public class TenantContextFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String tenantId = httpRequest.getHeader("X-TenantID");
        log.debug(TENANT_FILTER_PROCESS + ": " + tenantId);
        if (tenantId != null && !tenantId.isEmpty()) {
            TenantContext.setTenant(tenantId);
            log.info(TENANT_FILTER_SET + ": " + tenantId);
        } else {
            TenantContext.clear();
            log.warn(TENANT_FILTER_NO_ID);
        }
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            log.debug(TENANT_FILTER_CLEAR);
        }
    }
}
