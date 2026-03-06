package com.example.frly.email;


import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;


@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${app.mail.from:frylyapp@gmail.com}")
    private String fromAddress = "frylyapp@gmail.com";

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    public void sendPlainText(String to, String subject, String body) {
        sendEmail(to, subject, body, false);
    }

    public void sendHtml(String to, String subject, String htmlBody) {
        sendEmail(to, subject, htmlBody, true);
    }

    private void sendEmail(String to, String subject, String content, boolean isHtml) {
        Email from = new Email(fromAddress);
        Email toEmail = new Email(to);
        Content mailContent = new Content(isHtml ? "text/html" : "text/plain", content);
        Mail mail = new Mail(from, subject, toEmail, mailContent);
        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            log.info("Sent {} email to {} with subject {}. Status: {}", isHtml ? "HTML" : "plain text", to, subject, response.getStatusCode());
        } catch (Exception ex) {
            log.error("Failed to send {} email to {}", isHtml ? "HTML" : "plain text", to, ex);
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
