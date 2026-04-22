package com.corazyarcade.coa_auth_server.global.exception;

import com.corazyarcade.coa_auth_server.domain.auth.exception.NicknameRequiredException;
import com.corazyarcade.coa_auth_server.global.dto.ErrorResponse;
import com.corazyarcade.coa_auth_server.global.dto.ValidationErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

import static com.corazyarcade.coa_auth_server.global.exception.GlobalErrorCode.INTERNAL_SERVER_ERROR;
import static com.corazyarcade.coa_auth_server.global.exception.GlobalErrorCode.INVALID_ARGUMENT;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NicknameRequiredException.class)
    public ResponseEntity<Map<String, String>> handleNicknameRequiredException(NicknameRequiredException ex) {
        log.warn("NicknameRequiredException occurred: sessionToken={}", ex.getSessionToken());

        Map<String, String> response = new HashMap<>();
        response.put("error", ex.getErrorCode().getCode());
        response.put("message", ex.getMessage());
        response.put("sessionToken", ex.getSessionToken());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ErrorResponse> handleApplicationException(ApplicationException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("ApplicationException occurred: {} {}", errorCode.getCode(), ex.getMessage());
        return new ResponseEntity<>(ErrorResponse.of(errorCode, ex.getMessage()), errorCode.getHttpStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String fieldName = error.getField();
            String errorMessage = error.getDefaultMessage();
            // 중복된 필드의 경우 첫 번째 에러만 사용
            errors.putIfAbsent(fieldName, errorMessage);
            log.debug("Validation exception: field={}, message={}", fieldName, errorMessage);
        });

        ValidationErrorResponse response = ValidationErrorResponse.of(INVALID_ARGUMENT, errors);

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        ErrorCode errorCode = GlobalErrorCode.from(ex);
        if (errorCode == INTERNAL_SERVER_ERROR) {
            log.error("Unknown exception occurred: {}", ex.getMessage(), ex);
        } else {
            log.warn("Exception occurred: {} {}",
                    errorCode.getCode(), ex.getMessage());
        }
        return new ResponseEntity<>(ErrorResponse.of(errorCode, ex.getMessage()), errorCode.getHttpStatus());
    }
}
