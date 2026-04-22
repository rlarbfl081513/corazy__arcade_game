package com.corazyarcade.coa_auth_server.domain.user.repository;

import com.corazyarcade.coa_auth_server.domain.user.domain.Membership;
import com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    Optional<Membership> findByGrade(MembershipGrade grade);
}
