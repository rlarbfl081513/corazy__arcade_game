package com.corazyarcade.coa_main_server.global.exception;

import lombok.Getter;

@Getter
public class ApplicationException extends RuntimeException {
    private final ErrorCode errorCode;

    public ApplicationException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ApplicationException(ErrorCode errorCode, String information) {
        super(information + errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
