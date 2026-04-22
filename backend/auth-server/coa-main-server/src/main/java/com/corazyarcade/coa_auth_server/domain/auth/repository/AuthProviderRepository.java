package com.corazyarcade.coa_auth_server.domain.auth.repository;

import com.corazyarcade.coa_auth_server.domain.auth.domain.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthProviderRepository extends JpaRepository<AuthProvider, Long> {
    Optional<AuthProvider> findByName(String name);
}
