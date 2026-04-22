package com.corazyarcade.coa_main_server.global.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        log.info("JwtTokenProvider initialized successfully");
    }

    /**
     * JWT 토큰을 파싱하여 Claims를 반환합니다.
     * @param token JWT 토큰
     * @return Claims 객체
     * @throws io.jsonwebtoken.JwtException JWT 파싱 실패 시
     */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("Failed to parse JWT token: {}", maskToken(token), e);
            throw e;
        }
    }

    /**
     * JWT 토큰이 유효한지 검증합니다.
     * @param token JWT 토큰
     * @return 유효하면 true, 그렇지 않으면 false
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            log.debug("JWT token validation successful: {}", maskToken(token));
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired - Token: {}, Expired at: {}",
                    maskToken(token), e.getClaims().getExpiration());
            return false;
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token format - Token: {}, Error: {}",
                    maskToken(token), e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.error("Malformed JWT token - Token: {}, Error: {}",
                    maskToken(token), e.getMessage());
            return false;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature - Token: {}, Error: {}",
                    maskToken(token), e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.error("JWT token is empty or null - Token: {}, Error: {}",
                    maskToken(token), e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during JWT validation - Token: {}, Exception: {}, Message: {}",
                    maskToken(token), e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    /**
     * 토큰을 마스킹하여 로그에 안전하게 출력합니다.
     * 예: "eyJhbGciOiJ..." -> "eyJh...****"
     * @param token JWT 토큰
     * @return 마스킹된 토큰 문자열
     */
    private String maskToken(String token) {
        if (token == null) {
            return "null";
        }
        if (token.isEmpty()) {
            return "empty";
        }
        if (token.length() <= 8) {
            return "****";
        }
        return token.substring(0, 4) + "..." + "****";
    }
}
