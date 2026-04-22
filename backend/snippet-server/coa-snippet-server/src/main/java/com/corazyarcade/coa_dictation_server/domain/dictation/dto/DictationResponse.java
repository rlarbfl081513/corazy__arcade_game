package com.corazyarcade.coa_dictation_server.domain.dictation.dto;

import com.corazyarcade.coa_dictation_server.domain.dictation.entity.Dictation;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DictationResponse {
    private Long id;
    private Long algorithmId;
    private String algorithmName;
    private Long programmingLanguageId;
    private String programmingLanguageName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DictationResponse from(Dictation dictation) {
        return DictationResponse.builder()
                .id(dictation.getId())
                .algorithmId(dictation.getDictationAlgorithm().getId())
                .algorithmName(dictation.getDictationAlgorithm().getName())
                .programmingLanguageId(dictation.getProgrammingLanguage().getId())
                .programmingLanguageName(dictation.getProgrammingLanguage().getName())
                .title(dictation.getTitle())
                .content(dictation.getContent())
                .createdAt(dictation.getCreatedAt())
                .updatedAt(dictation.getUpdatedAt())
                .build();
    }
}
