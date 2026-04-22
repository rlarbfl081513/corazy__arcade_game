package com.corazyarcade.coa_dictation_server.domain.programminglanguage.exception;

public class ProgrammingLanguageNotFoundException extends RuntimeException {
    public ProgrammingLanguageNotFoundException(Long id) {
        super("ProgrammingLanguage not found: id=" + id);
    }
}
