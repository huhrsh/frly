package com.example.frly.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.jose4j.lang.JoseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.*;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${web.push.public.key:}")
    private String publicKey;

    @Value("${web.push.private.key:}")
    private String privateKey;

    @Value("${web.push.subject:mailto:support@fryly.com}")
    private String subject;

    private PushService pushService;

    @PostConstruct
    public void init() throws GeneralSecurityException {
        Security.addProvider(new BouncyCastleProvider());
        
        // Generate keys if not provided (for development)
        if (publicKey == null || publicKey.isEmpty() || privateKey == null || privateKey.isEmpty()) {
            try {
                log.warn("No VAPID keys configured. Generating new keys for development...");
                
                // Generate EC key pair on prime256v1 curve (required for VAPID)
                KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("EC", "BC");
                ECGenParameterSpec ecSpec = new ECGenParameterSpec("prime256v1");
                keyPairGenerator.initialize(ecSpec, new SecureRandom());
                KeyPair keyPair = keyPairGenerator.generateKeyPair();
                
                // Extract and encode public key (65 bytes uncompressed format)
                ECPublicKey ecPublicKey = (ECPublicKey) keyPair.getPublic();
                byte[] publicKeyBytes = ecPublicKey.getW().getAffineX().toByteArray();
                byte[] publicKeyY = ecPublicKey.getW().getAffineY().toByteArray();
                
                // Build uncompressed public key: 0x04 + X (32 bytes) + Y (32 bytes)
                byte[] uncompressedPublicKey = new byte[65];
                uncompressedPublicKey[0] = 0x04;
                System.arraycopy(trimOrPadTo32Bytes(publicKeyBytes), 0, uncompressedPublicKey, 1, 32);
                System.arraycopy(trimOrPadTo32Bytes(publicKeyY), 0, uncompressedPublicKey, 33, 32);
                
                publicKey = Base64.getUrlEncoder().withoutPadding().encodeToString(uncompressedPublicKey);
                
                // Extract and encode private key (32 bytes)
                ECPrivateKey ecPrivateKey = (ECPrivateKey) keyPair.getPrivate();
                byte[] privateKeyBytes = ecPrivateKey.getS().toByteArray();
                privateKeyBytes = trimOrPadTo32Bytes(privateKeyBytes);
                
                privateKey = Base64.getUrlEncoder().withoutPadding().encodeToString(privateKeyBytes);
                
                log.info("Generated VAPID Public Key: {}", publicKey);
                log.info("Add these to application.properties:");
                log.info("web.push.public.key={}", publicKey);
                log.info("web.push.private.key={}", privateKey);
            } catch (Exception e) {
                log.error("Failed to generate VAPID keys", e);
                throw new RuntimeException("Failed to initialize Web Push service", e);
            }
        }
        
        pushService = new PushService(publicKey, privateKey, subject);
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void sendPushNotification(Long userId, String title, String body, String clickUrl) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserId(userId);

        for (PushSubscription subscription : subscriptions) {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("title", title);
                payload.put("body", body);
                Map<String, Object> dataMap = new HashMap<>();
                dataMap.put("url", clickUrl != null ? clickUrl : "/");
                payload.put("data", dataMap);
                
                String payloadJson = objectMapper.writeValueAsString(payload);
                
                nl.martijndwars.webpush.Subscription webPushSubscription = 
                    new nl.martijndwars.webpush.Subscription(
                        subscription.getEndpoint(),
                        new nl.martijndwars.webpush.Subscription.Keys(
                            subscription.getP256dhKey(),
                            subscription.getAuthKey()
                        )
                    );
                
                Notification notification = new Notification(webPushSubscription, payloadJson);
                
                pushService.send(notification);
                log.info("Push notification sent to user {} via endpoint {}", userId, subscription.getEndpoint());
                
            } catch (GeneralSecurityException | IOException | JoseException | ExecutionException | InterruptedException e) {
                log.error("Failed to send push notification to user {} via endpoint {}", 
                    userId, subscription.getEndpoint(), e);
                
                // If endpoint is gone (410) or invalid, could delete subscription here
                // For now, just log the error
            }
        }
    }
    
    /**
     * Helper method to ensure key bytes are exactly 32 bytes.
     * BigInteger.toByteArray() can include a leading sign byte (0x00) or be shorter than 32 bytes.
     */
    private byte[] trimOrPadTo32Bytes(byte[] bytes) {
        if (bytes.length == 32) {
            return bytes;
        } else if (bytes.length > 32) {
            // Remove leading sign byte(s)
            byte[] trimmed = new byte[32];
            System.arraycopy(bytes, bytes.length - 32, trimmed, 0, 32);
            return trimmed;
        } else {
            // Pad with leading zeros
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 32 - bytes.length, bytes.length);
            return padded;
        }
    }
}
