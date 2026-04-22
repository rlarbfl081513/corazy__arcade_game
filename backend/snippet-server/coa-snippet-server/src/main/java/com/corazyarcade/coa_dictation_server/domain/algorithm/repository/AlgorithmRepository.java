package com.corazyarcade.coa_dictation_server.domain.algorithm.repository;

import com.corazyarcade.coa_dictation_server.domain.algorithm.entity.Algorithm;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlgorithmRepository extends JpaRepository<Algorithm, Long> {
    java.util.Optional<Algorithm> findByName(String name);
}
