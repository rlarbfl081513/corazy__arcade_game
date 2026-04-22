package com.corazyarcade.coa_auth_server.domain.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenResponse {
    private Boolean isNewUser;
    private String nickname;
    private String accessToken;
    private String refreshToken;
    private Long userId;
}
