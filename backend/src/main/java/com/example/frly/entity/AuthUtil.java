package com.example.frly.entity;

import com.example.frly.security.JwtUserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Slf4j
public class AuthUtil {
    public static Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof JwtUserPrincipal principal) {
                return principal.getId();
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }
}
