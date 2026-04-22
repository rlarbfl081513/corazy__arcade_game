package com.corazyarcade.coa_auth_server.domain.auth.repository;

import com.corazyarcade.coa_auth_server.domain.auth.domain.RefreshToken;
import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUserAndIssuedIpAndIssuedUserAgent(User user, String issuedIp, String issuedUserAgent);
}
