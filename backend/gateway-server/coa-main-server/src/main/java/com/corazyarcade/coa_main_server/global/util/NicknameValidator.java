package com.corazyarcade.coa_main_server.global.util;

import java.util.regex.Pattern;

public class NicknameValidator {

    private static final int MIN_LENGTH = 4;
    private static final int MAX_LENGTH = 20;
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9가-힣_]+$");

    public static boolean isValid(String nickname) {
        if (nickname == null) {
            return false;
        }

        int length = nickname.length();
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            return false;
        }

        return NICKNAME_PATTERN.matcher(nickname).matches();
    }

    public static void validate(String nickname) {
        if (nickname == null) {
            throw new IllegalArgumentException("닉네임은 필수입니다.");
        }

        int length = nickname.length();
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            throw new IllegalArgumentException("닉네임은 4자 이상 20자 이하여야 합니다.");
        }

        if (!NICKNAME_PATTERN.matcher(nickname).matches()) {
            throw new IllegalArgumentException("닉네임은 한글, 영어, 숫자, 언더스코어(_)만 사용 가능합니다.");
        }
    }
}
