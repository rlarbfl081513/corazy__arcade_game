package com.corazyarcade.coa_auth_server.domain.user.repository;

import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByNickname(String nickname);
}
