package com.example.frly.notification;

import lombok.Data;

@Data
public class PushSubscriptionDto {
    private String endpoint;
    private Keys keys;
    private String deviceInfo;
    
    @Data
    public static class Keys {
        private String p256dh;
        private String auth;
    }
}
