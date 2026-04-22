package com.corazyarcade.coa_dictation_server.domain.dictation.exception;

public class DictationAlgorithmNotFoundException extends RuntimeException {
    public DictationAlgorithmNotFoundException(Long id) {
        super("DictationAlgorithm not found: id=" + id);
    }
}
