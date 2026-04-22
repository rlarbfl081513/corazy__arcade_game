package com.corazyarcade.coa_dictation_server.domain.dictation.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictationCreateRequest {

    @NotNull
    private Long programmingLanguageId;

    private Long algorithmId;

    @Size(max = 100)
    private String algorithmName;

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    private String content;

    @AssertTrue(message = "algorithmId 또는 algorithmName 중 하나만 제공해야 합니다.")
    public boolean isValidAlgorithmSpecifier() {
        boolean hasId = algorithmId != null;
        boolean hasName = algorithmName != null && !algorithmName.isBlank();
        return hasId ^ hasName;
    }
}
