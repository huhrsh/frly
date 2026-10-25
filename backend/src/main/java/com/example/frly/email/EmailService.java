package com.example.frly.email;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Slf4j
@Service
public class EmailService {

    private final ConcurrentHashMap<String, String> templateCache = new ConcurrentHashMap<>();

    private final String fromAddress;
    private final RestClient client;

    @Autowired
    public EmailService(RestClient.Builder builder,
                        @Value("${brevo.api.key}") String apiKey,
                        @Value("${app.mail.from}") String fromAddress) {
        this.fromAddress = fromAddress;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        this.client = builder.baseUrl("https://api.brevo.com/v3")
                .requestFactory(factory)
                .defaultHeader("api-key", apiKey)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    EmailService(RestClient client, String fromAddress) {
        this.client = client;
        this.fromAddress = fromAddress;
    }

    public void sendPlainText(String to, String subject, String body) {
        sendEmail(to, subject, body, false);
    }

    public void sendHtml(String to, String subject, String htmlBody) {
        sendEmail(to, subject, htmlBody, true);
    }

    private void sendEmail(String to, String subject, String content, boolean isHtml) {
        try {
            var response = client.post().uri("/smtp/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "sender", Map.of("email", fromAddress),
                            "to", List.of(Map.of("email", to)),
                            "subject", subject,
                            isHtml ? "htmlContent" : "textContent", content))
                    .retrieve().toBodilessEntity();
            log.info("Brevo accepted {} email. Status: {}", isHtml ? "HTML" : "plain text", response.getStatusCode().value());
        } catch (RestClientResponseException ex) {
            // Preserve best-effort delivery; do not log provider bodies containing email content.
            log.error("Brevo rejected {} email. Status: {}", isHtml ? "HTML" : "plain text", ex.getStatusCode().value());
        } catch (Exception ex) {
            log.error("Failed to send {} email through Brevo ({})", isHtml ? "HTML" : "plain text", ex.getClass().getSimpleName());
        }
    }

    public String loadTemplate(String templatePath) {
        // Return cached template if available
        return templateCache.computeIfAbsent(templatePath, path -> {
            try {
                ClassPathResource resource = new ClassPathResource(path);
                if (!resource.exists()) {
                    throw new IllegalArgumentException("Email template not found: " + path);
                }
                // Properly closes InputStream automatically
                return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            } catch (IOException ex) {
                throw new RuntimeException("Failed to load email template: " + path, ex);
            }
        });
    }
}
