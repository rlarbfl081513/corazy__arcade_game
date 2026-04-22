package com.corazyarcade.coa_auth_server.domain.auth.repository;

import com.corazyarcade.coa_auth_server.domain.auth.domain.AuthProvider;
import com.corazyarcade.coa_auth_server.domain.auth.domain.UserAuthentication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthenticationRepository extends JpaRepository<UserAuthentication, Long> {
    Optional<UserAuthentication> findByProviderAndProvidedId(AuthProvider provider, String providedId);
}
