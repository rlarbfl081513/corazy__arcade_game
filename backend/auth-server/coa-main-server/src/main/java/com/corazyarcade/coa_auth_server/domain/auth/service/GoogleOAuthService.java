package com.corazyarcade.coa_auth_server.domain.auth.service;

import com.corazyarcade.coa_auth_server.domain.auth.domain.AuthProvider;
import com.corazyarcade.coa_auth_server.domain.auth.domain.UserAuthentication;
import com.corazyarcade.coa_auth_server.domain.auth.dto.*;
import com.corazyarcade.coa_auth_server.domain.auth.exception.NicknameRequiredException;
import com.corazyarcade.coa_auth_server.domain.auth.repository.AuthProviderRepository;
import com.corazyarcade.coa_auth_server.domain.auth.repository.UserAuthenticationRepository;
import com.corazyarcade.coa_auth_server.domain.user.domain.Membership;
import com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade;
import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import com.corazyarcade.coa_auth_server.domain.user.repository.MembershipRepository;
import com.corazyarcade.coa_auth_server.domain.user.repository.UserRepository;
import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static com.corazyarcade.coa_auth_server.domain.auth.exception.AuthErrorCode.*;
import static com.corazyarcade.coa_auth_server.domain.user.exception.UserErrorCode.MEMBERSHIP_NOT_FOUND;

@Slf4j
@RequiredArgsConstructor
@Service
public class GoogleOAuthService {

    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final AuthProviderRepository authProviderRepository;
    private final UserAuthenticationRepository userAuthenticationRepository;
    private final PendingUserStorage pendingUserStorage;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String GOOGLE_PROVIDER_NAME = "GOOGLE";

    @Transactional
    public TokenResponse processGoogleLogin(GoogleLoginRequest request, HttpServletRequest servletRequest) {
        // sessionToken이 있으면 세션 기반 플로우
        if (request.getSessionToken() != null && !request.getSessionToken().trim().isEmpty()) {
            return processSessionTokenLogin(request.getSessionToken(), request.getNickname(), servletRequest);
        }

        // code가 있으면 인가 코드 기반 플로우
        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            return processCodeLogin(request.getCode(), request.getNickname(), servletRequest);
        }

        // 둘 다 없으면 에러
        throw new ApplicationException(CODE_OR_SESSION_TOKEN_REQUIRED);
    }

    private TokenResponse processSessionTokenLogin(String sessionToken, String nickname, HttpServletRequest servletRequest) {
        log.info("Processing sessionToken-based login: sessionToken={}", sessionToken);

        // 1. 세션에서 Google 사용자 정보 조회
        PendingGoogleUser pendingUser = pendingUserStorage.retrieve(sessionToken)
            .orElseThrow(() -> new ApplicationException(INVALID_SESSION_TOKEN));

        // 2. nickname 검증 (필수)
        if (nickname == null || nickname.trim().isEmpty()) {
            log.warn("Nickname required for sessionToken login: sessionToken={}", sessionToken);
            throw new ApplicationException(NICKNAME_REQUIRED);
        }

        // 3. AuthProvider 조회 또는 생성
        AuthProvider authProvider = getOrCreateAuthProvider();

        // 4. 사용자 생성 (이미 존재 여부는 code 플로우에서 확인했으므로 여기서는 무조건 신규)
        User user = createUserWithGoogleAccount(pendingUser, authProvider, nickname.trim());
        log.info("New user created via sessionToken: userId={}, email={}, nickname={}",
            user.getId(), user.getEmail(), user.getNickname());

        // 5. JWT 토큰 발급
        return tokenService.issueToken(user, servletRequest, true);
    }

    private TokenResponse processCodeLogin(String code, String nickname, HttpServletRequest servletRequest) {
        log.info("Processing code-based login");

        // 인가 코드 정리 (URL 파라미터가 포함된 경우 제거)
        String cleanedCode = cleanAuthorizationCode(code);

        // 1. 구글에서 액세스 토큰 받기
        GoogleTokenResponse googleTokenResponse = getGoogleAccessToken(cleanedCode);

        // 2. 액세스 토큰으로 사용자 정보 받기
        GoogleUserInfo googleUserInfo = getGoogleUserInfo(googleTokenResponse.getAccessToken());

        // 3. AuthProvider 조회 또는 생성
        AuthProvider authProvider = getOrCreateAuthProvider();

        // 4. UserAuthentication 조회
        Optional<UserAuthentication> userAuthenticationOptional =
            userAuthenticationRepository.findByProviderAndProvidedId(authProvider, googleUserInfo.getSub());

        if (userAuthenticationOptional.isPresent()) {
            // 기존 사용자: nickname 무시하고 기존 정보로 토큰 발급
            User user = userAuthenticationOptional.get().getUser();
            log.info("Existing user login: userId={}, email={}", user.getId(), user.getEmail());
            return tokenService.issueToken(user, servletRequest, false);
        } else {
            // 신규 사용자
            if (nickname == null || nickname.trim().isEmpty()) {
                // nickname이 없으면 세션에 저장하고 400 에러 + sessionToken 반환
                String sessionToken = pendingUserStorage.store(googleUserInfo.getSub(), googleUserInfo.getEmail());
                log.info("New user detected, sessionToken issued: googleId={}, sessionToken={}",
                    googleUserInfo.getSub(), sessionToken);
                throw new NicknameRequiredException(sessionToken);
            }

            // nickname이 있으면 바로 회원가입
            User user = createUserWithGoogleAccount(googleUserInfo, authProvider, nickname.trim());
            log.info("New user created: userId={}, email={}, nickname={}",
                user.getId(), user.getEmail(), user.getNickname());
            return tokenService.issueToken(user, servletRequest, true);
        }
    }

    private GoogleTokenResponse getGoogleAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/x-www-form-urlencoded");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        // 디버깅 로그 추가
        log.info("=== Google Token Request ===");
        log.info("Code: {}", code);
        log.info("Client ID: {}", clientId);
        log.info("Client Secret: {}...", clientSecret != null ? clientSecret.substring(0, Math.min(10, clientSecret.length())) : "null");
        log.info("Redirect URI: {}", redirectUri);
        log.info("===========================");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<GoogleTokenResponse> response = restTemplate.postForEntity(
                GOOGLE_TOKEN_URL,
                request,
                GoogleTokenResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get Google access token", e);
            throw new ApplicationException(GOOGLE_TOKEN_REQUEST_FAILED);
        }
    }

    private GoogleUserInfo getGoogleUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
                GOOGLE_USER_INFO_URL,
                HttpMethod.GET,
                request,
                GoogleUserInfo.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get Google user info", e);
            throw new ApplicationException(GOOGLE_USER_INFO_REQUEST_FAILED);
        }
    }

    private AuthProvider getOrCreateAuthProvider() {
        return authProviderRepository.findByName(GOOGLE_PROVIDER_NAME)
            .orElseGet(() -> authProviderRepository.save(
                AuthProvider.builder()
                    .name(GOOGLE_PROVIDER_NAME)
                    .isActive(true)
                    .build()
            ));
    }

    private User createUserWithGoogleAccount(GoogleUserInfo googleUserInfo, AuthProvider authProvider, String nickname) {
        return createUser(googleUserInfo.getEmail(), googleUserInfo.getSub(), authProvider, nickname);
    }

    private User createUserWithGoogleAccount(PendingGoogleUser pendingUser, AuthProvider authProvider, String nickname) {
        return createUser(pendingUser.getEmail(), pendingUser.getGoogleId(), authProvider, nickname);
    }

    private User createUser(String email, String googleId, AuthProvider authProvider, String nickname) {
        // BASIC 멤버십 조회
        Membership basicMembership = membershipRepository.findByGrade(MembershipGrade.BASIC)
            .orElseThrow(() -> new ApplicationException(MEMBERSHIP_NOT_FOUND));

        // User 생성 (받은 닉네임 사용)
        User user = User.builder()
            .membership(basicMembership)
            .email(email)
            .nickname(nickname)
            .build();

        User savedUser = userRepository.save(user);

        // UserAuthentication 생성
        userAuthenticationRepository.save(
            UserAuthentication.builder()
                .user(savedUser)
                .provider(authProvider)
                .providedId(googleId)
                .isActive(true)
                .build()
        );

        return savedUser;
    }

    private String cleanAuthorizationCode(String code) {
        if (code == null || code.isEmpty()) {
            return code;
        }

        // 1. & 문자 이전까지만 추출 (URL 파라미터 제거)
        String cleanedCode = code;
        int ampersandIndex = code.indexOf('&');
        if (ampersandIndex > 0) {
            cleanedCode = code.substring(0, ampersandIndex);
            log.info("Authorization code contained URL parameters, cleaned: {} -> {}", code, cleanedCode);
        }

        // 2. URL 디코딩 (%2F -> / 등)
        try {
            cleanedCode = java.net.URLDecoder.decode(cleanedCode, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Failed to URL decode authorization code, using as-is", e);
        }

        // 3. 앞뒤 공백 제거
        cleanedCode = cleanedCode.trim();

        return cleanedCode;
    }
}
