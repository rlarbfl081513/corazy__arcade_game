package com.corazyarcade.coa_dictation_server.domain.dictation.dto;

import com.corazyarcade.coa_dictation_server.domain.dictation.entity.DictationAlgorithm;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DictationAlgorithmResponse {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DictationAlgorithmResponse from(DictationAlgorithm dictationAlgorithm) {
        return DictationAlgorithmResponse.builder()
                .id(dictationAlgorithm.getId())
                .name(dictationAlgorithm.getName())
                .createdAt(dictationAlgorithm.getCreatedAt())
                .updatedAt(dictationAlgorithm.getUpdatedAt())
                .build();
    }
}
