package com.corazyarcade.coa_auth_server.domain.auth.service;

import com.corazyarcade.coa_auth_server.domain.auth.dto.PendingGoogleUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class PendingUserStorage {

    private final Map<String, PendingGoogleUser> storage = new ConcurrentHashMap<>();

    // 5분 TTL
    private static final int TTL_MINUTES = 5;

    /**
     * Google 사용자 정보를 임시 저장하고 세션 키 반환
     */
    public String store(String googleId, String email) {
        String sessionKey = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(TTL_MINUTES);

        PendingGoogleUser pendingUser = new PendingGoogleUser(googleId, email, expiresAt);
        storage.put(sessionKey, pendingUser);

        log.info("Stored pending user: sessionKey={}, googleId={}, expiresAt={}", sessionKey, googleId, expiresAt);
        return sessionKey;
    }

    /**
     * 세션 키로 Google 사용자 정보 조회 및 삭제
     */
    public Optional<PendingGoogleUser> retrieve(String sessionKey) {
        PendingGoogleUser pendingUser = storage.remove(sessionKey);

        if (pendingUser == null) {
            log.warn("Pending user not found: sessionKey={}", sessionKey);
            return Optional.empty();
        }

        if (pendingUser.isExpired()) {
            log.warn("Pending user expired: sessionKey={}, googleId={}", sessionKey, pendingUser.getGoogleId());
            return Optional.empty();
        }

        log.info("Retrieved pending user: sessionKey={}, googleId={}", sessionKey, pendingUser.getGoogleId());
        return Optional.of(pendingUser);
    }

    /**
     * 매 10분마다 만료된 세션 정리
     */
    @Scheduled(fixedRate = 600000) // 10분
    public void cleanupExpiredSessions() {
        int beforeSize = storage.size();
        storage.entrySet().removeIf(entry -> entry.getValue().isExpired());
        int afterSize = storage.size();

        if (beforeSize != afterSize) {
            log.info("Cleaned up expired pending users: {} -> {}", beforeSize, afterSize);
        }
    }
}
