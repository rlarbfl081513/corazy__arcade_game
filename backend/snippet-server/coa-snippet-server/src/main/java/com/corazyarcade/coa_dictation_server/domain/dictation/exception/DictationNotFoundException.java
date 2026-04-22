package com.corazyarcade.coa_dictation_server.domain.dictation.exception;

public class DictationNotFoundException extends RuntimeException {
    public DictationNotFoundException(Long id) {
        super("Dictation not found: id=" + id);
    }

    public DictationNotFoundException(String message) {
        super(message);
    }
}
