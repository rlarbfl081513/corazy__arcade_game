package com.corazyarcade.coa_dictation_server.domain.dictation.controller;

import com.corazyarcade.coa_dictation_server.domain.dictation.dto.DictationAlgorithmResponse;
import com.corazyarcade.coa_dictation_server.domain.dictation.service.DictationAlgorithmService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dictations/algorithms")
public class DictationAlgorithmController {

    private final DictationAlgorithmService dictationAlgorithmService;

    public DictationAlgorithmController(DictationAlgorithmService dictationAlgorithmService) {
        this.dictationAlgorithmService = dictationAlgorithmService;
    }

    @GetMapping
    public List<DictationAlgorithmResponse> list() {
        return dictationAlgorithmService.listAll()
                .stream()
                .map(DictationAlgorithmResponse::from)
                .collect(Collectors.toList());
    }
}
