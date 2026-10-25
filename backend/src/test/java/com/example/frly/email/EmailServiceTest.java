package com.example.frly.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class EmailServiceTest {
    private EmailService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", "test-key");
        server = MockRestServiceServer.bindTo(builder).build();
        service = new EmailService(builder.build(), "sender@example.com");
    }

    @Test
    void sendsHtmlUsingBrevoContract() {
        expectEmail("htmlContent", "<p>Hello</p>");
        service.sendHtml("recipient@example.com", "Welcome", "<p>Hello</p>");
        server.verify();
    }

    @Test
    void sendsPlainTextUsingBrevoContract() {
        expectEmail("textContent", "Hello");
        service.sendPlainText("recipient@example.com", "Welcome", "Hello");
        server.verify();
    }

    @Test
    void preservesBestEffortBehaviorWhenProviderRejectsEmail() {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        assertDoesNotThrow(() -> service.sendPlainText("recipient@example.com", "Welcome", "Hello"));
        server.verify();
    }

    private void expectEmail(String contentField, String body) {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "test-key"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {"sender":{"email":"sender@example.com"},
                         "to":[{"email":"recipient@example.com"}],"subject":"Welcome",
                         "%s":"%s"}
                        """.formatted(contentField, body), true))
                .andRespond(withStatus(HttpStatus.CREATED).body("{\"messageId\":\"test\"}")
                        .contentType(MediaType.APPLICATION_JSON));
    }
}

