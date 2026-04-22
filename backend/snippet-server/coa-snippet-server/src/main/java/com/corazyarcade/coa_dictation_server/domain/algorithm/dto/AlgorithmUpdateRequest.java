package com.corazyarcade.coa_dictation_server.domain.algorithm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AlgorithmUpdateRequest {

    @NotBlank(message = "알고리즘 이름은 필수입니다")
    @Size(max = 100, message = "알고리즘 이름은 100자를 초과할 수 없습니다")
    private String name;
}
