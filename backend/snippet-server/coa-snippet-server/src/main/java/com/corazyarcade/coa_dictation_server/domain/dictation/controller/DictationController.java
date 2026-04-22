package com.corazyarcade.coa_dictation_server.domain.dictation.controller;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import com.corazyarcade.coa_dictation_server.domain.dictation.dto.DictationCreateRequest;
import com.corazyarcade.coa_dictation_server.domain.dictation.dto.DictationUpdateRequest;
import com.corazyarcade.coa_dictation_server.domain.dictation.dto.DictationResponse;
import com.corazyarcade.coa_dictation_server.domain.dictation.entity.Dictation;
import com.corazyarcade.coa_dictation_server.domain.dictation.service.DictationService;

@RestController
@RequestMapping("/api/dictations")
@Validated
public class DictationController {

    private final DictationService dictationService;

    public DictationController(DictationService dictationService) {
        this.dictationService = dictationService;
    }

    @PostMapping
    public ResponseEntity<DictationResponse> create(@Valid @RequestBody DictationCreateRequest request) {
        Dictation created = dictationService.create(
                request.getProgrammingLanguageId(),
                request.getAlgorithmId(),
                request.getAlgorithmName(),
                request.getTitle(),
                request.getContent());
        return ResponseEntity.created(URI.create("/api/dictations/" + created.getId()))
                .body(DictationResponse.from(created));
    }

    @GetMapping("/dictation")
    public List<DictationResponse> getDictations(
        @NotNull
        @RequestParam
        Long programmingLanguageId,
        @NotNull
        @RequestParam
        Long algorithmId
    ) {
        return dictationService.getDictations(programmingLanguageId, algorithmId)
                .stream()
                .map(DictationResponse::from)
                .collect(Collectors.toList());
    }
    

    @GetMapping("/{id}")
    public DictationResponse get(@PathVariable Long id) {
        return DictationResponse.from(dictationService.getById(id));
    }

    @GetMapping("")
    public DictationResponse getRandom(@RequestParam Long programmingLanguageId) {
        return DictationResponse.from(dictationService.getProgrammingRandomDictation(programmingLanguageId));
    }

    @GetMapping("/list")
    public List<DictationResponse> list() {
        return dictationService.listAll().stream().map(DictationResponse::from).collect(Collectors.toList());
    }

    @PutMapping("/{id}")
    public DictationResponse update(@PathVariable Long id, @Valid @RequestBody DictationUpdateRequest request) {
        return DictationResponse.from(dictationService.update(id, request.getTitle(), request.getContent()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dictationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
