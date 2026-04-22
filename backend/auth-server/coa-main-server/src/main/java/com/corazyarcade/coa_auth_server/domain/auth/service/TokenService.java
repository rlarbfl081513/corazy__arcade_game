package com.corazyarcade.coa_auth_server.domain.auth.service;

import com.corazyarcade.coa_auth_server.domain.auth.domain.RefreshToken;
import com.corazyarcade.coa_auth_server.domain.auth.dto.ReissueTokenRequest;
import com.corazyarcade.coa_auth_server.domain.auth.dto.TokenResponse;
import com.corazyarcade.coa_auth_server.domain.auth.repository.RefreshTokenRepository;
import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
import com.corazyarcade.coa_auth_server.global.security.config.JwtProperties;
import com.corazyarcade.coa_auth_server.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static com.corazyarcade.coa_auth_server.domain.auth.exception.AuthErrorCode.EXPIRED_REFRESH_TOKEN;
import static com.corazyarcade.coa_auth_server.domain.auth.exception.AuthErrorCode.INVALID_REFRESH_TOKEN;

@Slf4j
@RequiredArgsConstructor
@Service
public class TokenService {

    private final JwtProperties jwtProperties;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    public TokenResponse issueToken(User user, HttpServletRequest servletRequest) {
        return issueToken(user, servletRequest, null);
    }

    public TokenResponse issueToken(User user, HttpServletRequest servletRequest, Boolean isNewUser) {
        String accessToken = createAccessToken(user);
        String refreshToken = createRefreshToken(user);

        saveRefreshToken(user, refreshToken, servletRequest);

        return buildTokenResponse(user, accessToken, refreshToken, isNewUser);
    }

    @Transactional
    public TokenResponse reissueToken(ReissueTokenRequest request) {
        String refreshTokenValue = request.getRefreshToken();

        // 1. JWT 만료 확인
        if (jwtTokenProvider.isExpired(refreshTokenValue)) {
            throw new ApplicationException(EXPIRED_REFRESH_TOKEN);
        }

        // 2. JWT에서 userId 추출
        Long userIdFromToken = jwtTokenProvider.getUserId(refreshTokenValue);

        // 3. DB에서 refresh token 조회
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new ApplicationException(INVALID_REFRESH_TOKEN));

        User user = refreshToken.getUser();

        // 4. 토큰 검증 (DB 만료 시간, userId 일치 여부)
        validateRefreshToken(refreshToken, userIdFromToken, user.getId());

        // 5. 새 토큰 발급
        String newAccessToken = createAccessToken(user);
        String newRefreshToken = createRefreshToken(user);

        // 6. Refresh Token Rotation (기존 토큰 무효화)
        refreshToken.rotate(newRefreshToken, getExpiredAt(jwtProperties.getRefreshTokenValidityInMs()));

        return buildTokenResponse(user, newAccessToken, newRefreshToken);
    }

    private String createAccessToken(User user) {
        return jwtTokenProvider.createAccessToken(
                String.valueOf(user.getId()),
                user.getNickname(),
                user.getMembership().getGrade().name(),
                getExpiredAt(jwtProperties.getAccessTokenValidityInMs())
        );
    }

    private String createRefreshToken(User user) {
        return jwtTokenProvider.createRefreshToken(
                String.valueOf(user.getId()),
                getExpiredAt(jwtProperties.getRefreshTokenValidityInMs())
        );
    }

    private void saveRefreshToken(User user, String tokenValue, HttpServletRequest servletRequest) {
        log.debug("userId: {}, IP: {}, userAgent: {}", user.getId(), getIp(servletRequest), servletRequest.getHeader("User-Agent"));
        Optional<RefreshToken> existingRefreshToken = refreshTokenRepository.findByUserAndIssuedIpAndIssuedUserAgent(user, getIp(servletRequest), servletRequest.getHeader("User-Agent"));
        LocalDateTime expiredAt = getExpiredAt(jwtProperties.getRefreshTokenValidityInMs());

        if (existingRefreshToken.isPresent()) {
            RefreshToken refreshToken = existingRefreshToken.get();
            refreshToken.rotate(tokenValue, expiredAt);
            return;
        }
        refreshTokenRepository.save(RefreshToken.builder()
                .token(tokenValue)
                .user(user)
                .issuedUserAgent(servletRequest.getHeader("User-Agent"))
                .issuedIp(getIp(servletRequest))
                .expired_at(expiredAt)
                .build());
    }


    private String getIp(HttpServletRequest servletRequest) {
        String ip = servletRequest.getHeader("CF-Connecting-IP");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = servletRequest.getHeader("X-Forwarded-For");
        }
        // XFF 헤더에 IP가 여러 개일 경우
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            ip = ip.split(",")[0];
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = servletRequest.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = servletRequest.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = servletRequest.getRemoteAddr();
        }
        return ip;
    }

    private LocalDateTime getExpiredAt(Long expiredMs) {
        return LocalDateTime.now().plus(Duration.ofMillis(expiredMs));
    }

    private TokenResponse buildTokenResponse(User user, String accessToken, String refreshToken) {
        return buildTokenResponse(user, accessToken, refreshToken, null);
    }

    private TokenResponse buildTokenResponse(User user, String accessToken, String refreshToken, Boolean isNewUser) {
        return TokenResponse.builder()
                .isNewUser(isNewUser)
                .nickname(user.getNickname())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .build();
    }

    private void validateRefreshToken(RefreshToken refreshToken, Long userId, Long userIdOfToken){
        // 만료 시간 변조 가능성
        // 요청 유저가 토큰 식별자와 일치하는지 확인
        if (refreshToken.isExpired() || !userId.equals(userIdOfToken)) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApplicationException(INVALID_REFRESH_TOKEN);
        }
    }
}
