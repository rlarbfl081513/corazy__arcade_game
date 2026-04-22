package com.corazyarcade.coa_dictation_server.domain.dictation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import com.corazyarcade.coa_dictation_server.domain.dictation.entity.Dictation;
import java.util.List;
import java.util.Optional;

public interface DictationRepository extends JpaRepository<Dictation, Long> {

        @Override
        @EntityGraph(attributePaths = { "dictationAlgorithm", "programmingLanguage" })
        Optional<Dictation> findById(Long id);

        @Override
        @EntityGraph(attributePaths = { "dictationAlgorithm", "programmingLanguage" })
        List<Dictation> findAll();

        @EntityGraph(attributePaths = { "dictationAlgorithm", "programmingLanguage" })
        List<Dictation> findByProgrammingLanguageId(Long programmingLanguageId);

        @EntityGraph(attributePaths = { "dictationAlgorithm", "programmingLanguage" })
        List<Dictation> findByProgrammingLanguageIdAndDictationAlgorithmId(Long programmingLanguageId, Long dictationAlgorithmId);
}
