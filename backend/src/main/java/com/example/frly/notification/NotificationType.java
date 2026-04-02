package com.example.frly.notification;

public class NotificationType {
    // List/Checklist notifications
    public static final String ITEM_ADDED = "ITEM_ADDED";
    public static final String ITEM_UPDATED = "ITEM_UPDATED";
    public static final String ITEM_DELETED = "ITEM_DELETED";
    public static final String ITEM_COMPLETED = "ITEM_COMPLETED";
    
    // Payment notifications
    public static final String PAYMENT_ADDED = "PAYMENT_ADDED";
    public static final String PAYMENT_UPDATED = "PAYMENT_UPDATED";
    public static final String PAYMENT_DELETED = "PAYMENT_DELETED";
    public static final String SETTLEMENT_ADDED = "SETTLEMENT_ADDED";
    
    // Reminder notifications
    public static final String REMINDER_CREATED = "REMINDER_CREATED";
    public static final String REMINDER_UPDATED = "REMINDER_UPDATED";
    public static final String REMINDER_DELETED = "REMINDER_DELETED";
    public static final String REMINDER_DUE = "REMINDER_DUE";
    public static final String REMINDER_OVERDUE = "REMINDER_OVERDUE";
    public static final String REMINDER_COMPLETED = "REMINDER_COMPLETED";
    
    // Section notifications
    public static final String SECTION_CREATED = "SECTION_CREATED";
    public static final String SECTION_UPDATED = "SECTION_UPDATED";
    public static final String SECTION_DELETED = "SECTION_DELETED";
    
    // Note notifications
    public static final String NOTE_CREATED = "NOTE_CREATED";
    public static final String NOTE_UPDATED = "NOTE_UPDATED";
    
    // Calendar notifications
    public static final String EVENT_CREATED = "EVENT_CREATED";
    public static final String EVENT_UPDATED = "EVENT_UPDATED";
    public static final String EVENT_DELETED = "EVENT_DELETED";
    
    // Gallery notifications
    public static final String FILE_UPLOADED = "FILE_UPLOADED";
    public static final String FILE_DELETED = "FILE_DELETED";
    
    // Link notifications
    public static final String LINK_ADDED = "LINK_ADDED";
    public static final String LINK_DELETED = "LINK_DELETED";
    
    // Group notifications
    public static final String GROUP_INVITE_RECEIVED = "GROUP_INVITE_RECEIVED";
    public static final String GROUP_JOIN_REQUEST = "GROUP_JOIN_REQUEST";
    public static final String GROUP_JOIN_APPROVED = "GROUP_JOIN_APPROVED";
    public static final String GROUP_JOIN_REJECTED = "GROUP_JOIN_REJECTED";
    public static final String MEMBER_JOINED = "MEMBER_JOINED";
    public static final String MEMBER_LEFT = "MEMBER_LEFT";
    public static final String MEMBER_REMOVED = "MEMBER_REMOVED";
    public static final String GROUP_LEFT = "GROUP_LEFT";
    public static final String GROUP_MEMBER_LEFT = "GROUP_MEMBER_LEFT";
    public static final String GROUP_MEMBER_REMOVED = "GROUP_MEMBER_REMOVED";
    
    private NotificationType() {
        // Utility class
    }
}
