package com.example.frly.group;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

import static com.example.frly.constants.LogConstants.*;

/**
 * Filter to extract group identifier from each request and store in GroupContext.
 * Example: expects X-Group-ID header in each request.
 */
@Slf4j
@Component
public class GroupContextFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String groupId = httpRequest.getHeader("X-Group-ID");
        log.debug(TENANT_FILTER_PROCESS + ": " + groupId);
        if (groupId != null && !groupId.isEmpty()) {
            GroupContext.setGroupId(groupId);
            log.info(TENANT_FILTER_SET + ": " + groupId);
        } else {
            GroupContext.clear();
            log.warn(TENANT_FILTER_NO_ID);
        }
        try {
            chain.doFilter(request, response);
        } finally {
            GroupContext.clear();
            log.debug(TENANT_FILTER_CLEAR);
        }
    }
}
