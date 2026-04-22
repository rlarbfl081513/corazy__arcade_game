package com.corazyarcade.coa_dictation_server.domain.dictation.service;

import java.util.List;
import java.util.Random;
import java.util.Optional;

import com.corazyarcade.coa_dictation_server.domain.dictation.entity.DictationAlgorithm;
import com.corazyarcade.coa_dictation_server.domain.dictation.exception.DictationAlgorithmNotFoundException;
import com.corazyarcade.coa_dictation_server.domain.dictation.repository.DictationAlgorithmRepository;
import com.corazyarcade.coa_dictation_server.domain.programminglanguage.entity.ProgrammingLanguage;
import com.corazyarcade.coa_dictation_server.domain.programminglanguage.exception.ProgrammingLanguageNotFoundException;
import com.corazyarcade.coa_dictation_server.domain.programminglanguage.repository.ProgrammingLanguageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.corazyarcade.coa_dictation_server.domain.dictation.entity.Dictation;
import com.corazyarcade.coa_dictation_server.domain.dictation.exception.DictationNotFoundException;
import com.corazyarcade.coa_dictation_server.domain.dictation.repository.DictationRepository;

@Service
@Transactional(readOnly = true)
public class DictationService {

    private final DictationRepository dictationRepository;
    private final DictationAlgorithmRepository dictationAlgorithmRepository;
    private final ProgrammingLanguageRepository programmingLanguageRepository;

    public DictationService(
            DictationRepository dictationRepository,
            DictationAlgorithmRepository dictationAlgorithmRepository,
            ProgrammingLanguageRepository programmingLanguageRepository) {
        this.dictationRepository = dictationRepository;
        this.dictationAlgorithmRepository = dictationAlgorithmRepository;
        this.programmingLanguageRepository = programmingLanguageRepository;
    }

    public List<Dictation> getDictations(Long programmingLanguageId, Long dictationAlgorithmId) {
        return dictationRepository.findByProgrammingLanguageIdAndDictationAlgorithmId(programmingLanguageId, dictationAlgorithmId);
    }

    @Transactional
    public Dictation create(Long programmingLanguageId, Long dictationAlgorithmId, String algorithmName, String title,
            String content) {
        ProgrammingLanguage programmingLanguage = programmingLanguageRepository.findById(programmingLanguageId)
                .orElseThrow(() -> new ProgrammingLanguageNotFoundException(programmingLanguageId));

        DictationAlgorithm dictationAlgorithm;
        if (dictationAlgorithmId != null) {
            dictationAlgorithm = dictationAlgorithmRepository.findById(dictationAlgorithmId)
                    .orElseThrow(() -> new DictationAlgorithmNotFoundException(dictationAlgorithmId));
        } else {
            dictationAlgorithm = dictationAlgorithmRepository.findByName(algorithmName)
                    .orElseGet(() -> dictationAlgorithmRepository.save(DictationAlgorithm.builder().name(algorithmName).build()));
        }

        Dictation dictation = new Dictation();
        dictation.setDictationAlgorithm(dictationAlgorithm);
        dictation.setProgrammingLanguage(programmingLanguage);
        dictation.setTitle(title);
        dictation.setContent(content);

        return dictationRepository.save(dictation);
    }

    public Dictation getById(Long id) {
        return dictationRepository.findById(id)
                .orElseThrow(() -> new DictationNotFoundException(id));
    }

    public Dictation getProgrammingRandomDictation(Long programmingLanguageId) {
        // ProgrammingLanguage가 존재하는지 먼저 확인
        if (!programmingLanguageRepository.existsById(programmingLanguageId)) {
            throw new ProgrammingLanguageNotFoundException(programmingLanguageId);
        }

        // 해당 언어의 모든 Dictation 조회
        List<Dictation> dictations = dictationRepository.findByProgrammingLanguageId(programmingLanguageId);

        // 해당 언어의 Dictation이 없을 경우 예외 처리
        if (dictations.isEmpty()) {
            throw new DictationNotFoundException("해당 프로그래밍 언어에 대한 받아쓰기가 없습니다.");
        }

        // 랜덤으로 하나 선택
        Random random = new Random();
        int randomIndex = random.nextInt(dictations.size());
        return dictations.get(randomIndex);
    }

    public List<Dictation> listAll() {
        return dictationRepository.findAll();
    }

    @Transactional
    public Dictation update(Long id, String title, String content) {
        Dictation existing = getById(id);
        existing.setTitle(title);
        existing.setContent(content);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        if (!dictationRepository.existsById(id)) {
            throw new DictationNotFoundException(id);
        }
        dictationRepository.deleteById(id);
    }
}
