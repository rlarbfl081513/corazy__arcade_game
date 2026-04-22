package com.corazyarcade.coa_auth_server.domain.auth.controller;

import com.corazyarcade.coa_auth_server.domain.auth.dto.GoogleLoginRequest;
import com.corazyarcade.coa_auth_server.domain.auth.dto.ReissueTokenRequest;
import com.corazyarcade.coa_auth_server.domain.auth.dto.TokenResponse;
import com.corazyarcade.coa_auth_server.domain.auth.service.GoogleOAuthService;
import com.corazyarcade.coa_auth_server.domain.auth.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "인증/인가", description = "인증/인가 관련 API")
@Slf4j
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@RestController
public class AuthController {

    private final TokenService tokenService;
    private final GoogleOAuthService googleOAuthService;

    @Operation(summary = "access token 재발행", description = "refresh token으로 access 토큰과 refresh 토큰을 다시 발행합니다.")
    @PostMapping("/reissue-token")
    public ResponseEntity<TokenResponse> reissueToken(@RequestBody ReissueTokenRequest request) {
        TokenResponse tokenResponse = tokenService.reissueToken(request);
        return ResponseEntity.ok(tokenResponse);
    }

    @Operation(summary = "구글 로그인", description = "구글 인가 코드(또는 세션 토큰)와 닉네임으로 로그인하여 JWT 토큰을 발급합니다.")
    @PostMapping("/google/login")
    public ResponseEntity<TokenResponse> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletRequest servletRequest) {
        TokenResponse tokenResponse = googleOAuthService.processGoogleLogin(request, servletRequest);
        return ResponseEntity.ok(tokenResponse);
    }
}
