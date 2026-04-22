package com.corazyarcade.coa_auth_server.domain.user.exception;

import com.corazyarcade.coa_auth_server.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {

    // 400 - 요청값
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "USER-400-01", "비밀번호가 일치하지 않습니다."),
    MISSING_REQUIRED_TERMS(HttpStatus.BAD_REQUEST, "USER-400-02", "필수 약관에 동의해야 합니다."),

    // 404 - 리소스 없음
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER-404-01", "사용자를 찾을 수 없습니다."),
    MEMBERSHIP_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER-404-02", "멤버십 등급을 찾을 수 없습니다."),

    // 409 - 중복
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "USER-409-01", "이미 사용 중인 이메일입니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "USER-409-02", "이미 사용 중인 닉네임입니다."),

    // 500 서버
    NICKNAME_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "USER-500-01", "닉네임 생성 중 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
