package com.example.frly.common;

import com.example.frly.common.exception.BadRequestException;
import com.example.frly.common.exception.ForbiddenException;
import com.example.frly.common.exception.StorageLimitExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Centralises error responses so the exception message is included in the
 * response body.  Without this, @ResponseStatus-annotated exceptions lose
 * their message when ResponseStatusExceptionResolver calls sendError()
 * without the reason string.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("status", 400, "error", "Bad Request", "message", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("status", 403, "error", "Forbidden", "message", ex.getMessage()));
    }

    @ExceptionHandler(StorageLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleStorageLimit(StorageLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("status", 403, "error", "Forbidden", "message", ex.getMessage()));
    }
}
