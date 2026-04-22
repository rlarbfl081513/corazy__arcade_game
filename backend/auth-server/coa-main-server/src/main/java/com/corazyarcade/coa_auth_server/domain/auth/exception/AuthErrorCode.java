package com.corazyarcade.coa_auth_server.domain.auth.exception;

import com.corazyarcade.coa_auth_server.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    // 400
    NICKNAME_REQUIRED(HttpStatus.BAD_REQUEST, "NICKNAME_REQUIRED", "닉네임을 입력해주세요"),
    CODE_OR_SESSION_TOKEN_REQUIRED(HttpStatus.BAD_REQUEST, "AUTH-400-02", "인가 코드 또는 세션 토큰이 필요합니다."),
    INVALID_SESSION_TOKEN(HttpStatus.BAD_REQUEST, "AUTH-400-03", "유효하지 않거나 만료된 세션 토큰입니다."),

    // 401
    EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-401-03", "만료된 Refresh Token입니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-401-05", "유효하지 않은 Refresh Token입니다."),

    // 500
    GOOGLE_TOKEN_REQUEST_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH-500-01", "Google 액세스 토큰 요청에 실패했습니다."),
    GOOGLE_USER_INFO_REQUEST_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH-500-02", "Google 사용자 정보 요청에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
