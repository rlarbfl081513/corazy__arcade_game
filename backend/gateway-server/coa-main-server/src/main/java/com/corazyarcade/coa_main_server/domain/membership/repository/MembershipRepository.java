package com.corazyarcade.coa_main_server.domain.membership.repository;

import com.corazyarcade.coa_main_server.domain.membership.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    Optional<Membership> findByGrade(String grade);
}
