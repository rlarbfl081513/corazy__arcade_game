package com.corazyarcade.coa_dictation_server.global.dto;

import com.corazyarcade.coa_dictation_server.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ValidationErrorResponse {

    private int status;
    private String code;
    private String message;
    private Map<String, String> fieldErrors;

    public static ValidationErrorResponse of(ErrorCode errorCode, Map<String, String> fieldErrors) {
        return ValidationErrorResponse.builder()
                .status(errorCode.getHttpStatus().value())
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .fieldErrors(fieldErrors)
                .build();
    }
}
