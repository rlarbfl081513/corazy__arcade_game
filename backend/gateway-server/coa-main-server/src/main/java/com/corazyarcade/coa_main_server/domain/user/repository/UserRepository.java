package com.corazyarcade.coa_main_server.domain.user.repository;

import com.corazyarcade.coa_main_server.domain.user.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    boolean existsByNickname(String nickname);
    Optional<Users> findByNickname(String nickname);
}
