package com.corazyarcade.coa_dictation_server.domain.algorithm.exception;

public class AlgorithmNotFoundException extends RuntimeException {
    public AlgorithmNotFoundException(Long id) {
        super("Algorithm not found: id=" + id);
    }
}
