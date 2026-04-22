package com.corazyarcade.coa_dictation_server.domain.dictation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.corazyarcade.coa_dictation_server.domain.dictation.entity.DictationAlgorithm;
import java.util.Optional;

public interface DictationAlgorithmRepository extends JpaRepository<DictationAlgorithm, Long> {
    Optional<DictationAlgorithm> findByName(String name);
}
