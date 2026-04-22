package com.corazyarcade.coa_dictation_server.domain.dictation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictationUpdateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    private String content;
}
