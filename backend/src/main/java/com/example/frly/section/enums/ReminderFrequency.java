package com.example.frly.section.enums;

import java.time.LocalDateTime;

public enum ReminderFrequency {
    ONCE {
        @Override
        public LocalDateTime calculateNextOccurrence(LocalDateTime current) {
            return null; // One-time reminders don't repeat
        }

        @Override
        public boolean shouldRepeat() {
            return false;
        }
    },
    DAILY {
        @Override
        public LocalDateTime calculateNextOccurrence(LocalDateTime current) {
            return current.plusDays(1);
        }

        @Override
        public boolean shouldRepeat() {
            return true;
        }
    },
    WEEKLY {
        @Override
        public LocalDateTime calculateNextOccurrence(LocalDateTime current) {
            return current.plusWeeks(1);
        }

        @Override
        public boolean shouldRepeat() {
            return true;
        }
    },
    MONTHLY {
        @Override
        public LocalDateTime calculateNextOccurrence(LocalDateTime current) {
            return current.plusMonths(1);
        }

        @Override
        public boolean shouldRepeat() {
            return true;
        }
    },
    YEARLY {
        @Override
        public LocalDateTime calculateNextOccurrence(LocalDateTime current) {
            return current.plusYears(1);
        }

        @Override
        public boolean shouldRepeat() {
            return true;
        }
    };

    /**
     * Calculates the next occurrence time for recurring reminders
     * @param current The current trigger time
     * @return The next trigger time, or null if reminder doesn't repeat
     */
    public abstract LocalDateTime calculateNextOccurrence(LocalDateTime current);

    /**
     * Indicates whether this frequency type should repeat
     * @return true if reminder should repeat, false otherwise
     */
    public abstract boolean shouldRepeat();

    /**
     * Safely parses a frequency string to enum
     * @param frequency The frequency string (case-insensitive)
     * @return The corresponding enum, or ONCE as default
     */
    public static ReminderFrequency fromString(String frequency) {
        if (frequency == null) {
            return ONCE;
        }
        try {
            return valueOf(frequency.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ONCE; // Default to ONCE for unknown frequencies
        }
    }
}

