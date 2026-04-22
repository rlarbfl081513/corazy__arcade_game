package com.corazyarcade.coa_dictation_server.domain.programminglanguage.repository;

import com.corazyarcade.coa_dictation_server.domain.programminglanguage.entity.ProgrammingLanguage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgrammingLanguageRepository extends JpaRepository<ProgrammingLanguage, Long> {
}
