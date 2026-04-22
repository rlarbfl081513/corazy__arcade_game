package com.corazyarcade.coa_auth_server.global.security.jwt;

import com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade;
import com.corazyarcade.coa_auth_server.global.security.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import static io.jsonwebtoken.security.Keys.hmacShaKeyFor;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;

    private static final String JWT_CLAIM_USER_ID = "user_id";
    private static final String JWT_CLAIM_NICKNAME = "nickname";
    private static final String JWT_CLAIM_GRADE = "grade";

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.secretKey = hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(String userId, String nickname, String grade, LocalDateTime expiredAt) {
        return Jwts.builder()
                .claim(JWT_CLAIM_USER_ID, userId)
                .claim(JWT_CLAIM_NICKNAME, nickname)
                .claim(JWT_CLAIM_GRADE, grade)
                .issuedAt(convertLocalDateTimeToDate(LocalDateTime.now()))
                .expiration(convertLocalDateTimeToDate(expiredAt))
                .signWith(secretKey)
                .compact();
    }

    public String createRefreshToken(String userId, LocalDateTime expiredAt) {
        return Jwts.builder()
                .claim(JWT_CLAIM_USER_ID, userId)
                .issuedAt(convertLocalDateTimeToDate(LocalDateTime.now()))
                .expiration(convertLocalDateTimeToDate(expiredAt))
                .signWith(secretKey)
                .compact();
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).get(JWT_CLAIM_USER_ID, String.class));
    }

    public String getNickname(String token) {
        return parseClaims(token).get(JWT_CLAIM_NICKNAME, String.class);
    }

    public MembershipGrade getGrade(String token) {
        return MembershipGrade.valueOf(parseClaims(token).get(JWT_CLAIM_GRADE, String.class));
    }

    public boolean isExpired(String token) {
        return parseClaims(token)
                .getExpiration()
                .before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(secretKey).build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Date convertLocalDateTimeToDate(LocalDateTime time) {
        return Date.from(time.atZone(ZoneId.systemDefault()).toInstant());
    }
}
