package com.example.frly.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:harshj2010@gmail.com}")
    private String fromAddress = "harshj2010@gmail.com";

    public void sendPlainText(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setFrom(fromAddress);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Sent email to {} with subject {}", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to {}", to, ex);
        }
    }

    public void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(to);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
            log.info("Sent HTML email to {} with subject {}", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send HTML email to {}", to, ex);
        }
    }

    public String loadTemplate(String templatePath) {
        try {
            InputStream in = getClass().getClassLoader().getResourceAsStream(templatePath);
            if (in == null) {
                throw new IllegalArgumentException("Email template not found: " + templatePath);
            }
            byte[] bytes = in.readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to load email template: " + templatePath, ex);
        }
    }
}
