package com.corazyarcade.coa_dictation_server.domain.dictation.service;

import com.corazyarcade.coa_dictation_server.domain.dictation.entity.DictationAlgorithm;
import com.corazyarcade.coa_dictation_server.domain.dictation.repository.DictationAlgorithmRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DictationAlgorithmService {

    private final DictationAlgorithmRepository dictationAlgorithmRepository;

    public DictationAlgorithmService(DictationAlgorithmRepository dictationAlgorithmRepository) {
        this.dictationAlgorithmRepository = dictationAlgorithmRepository;
    }

    public List<DictationAlgorithm> listAll() {
        return dictationAlgorithmRepository.findAll();
    }
}
