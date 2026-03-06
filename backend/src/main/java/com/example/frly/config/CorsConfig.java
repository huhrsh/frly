package com.example.frly.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    /**
     * Comma-separated list of allowed origin patterns.
     *
     * Can be set via application.properties:
     *   cors.allowed-origins=https://app.example.com,https://*.vercel.app
     * or environment variable:
     *   CORS_ALLOWED_ORIGINS=https://app.example.com,https://*.vercel.app
     */
    @Value("${spring.web.cors.allowed-origins}")
    private List<String> allowedOriginPatterns;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Use patterns from configuration/env, with sensible defaults for Cloudflare, local dev and Vercel
        config.setAllowedOriginPatterns(allowedOriginPatterns);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}