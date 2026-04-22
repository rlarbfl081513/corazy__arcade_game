package com.corazyarcade.coa_auth_server.domain.auth.exception;

import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
import lombok.Getter;

import static com.corazyarcade.coa_auth_server.domain.auth.exception.AuthErrorCode.NICKNAME_REQUIRED;

@Getter
public class NicknameRequiredException extends ApplicationException {
    private final String sessionToken;

    public NicknameRequiredException(String sessionToken) {
        super(NICKNAME_REQUIRED);
        this.sessionToken = sessionToken;
    }
}
