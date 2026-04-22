package com.corazyarcade.coa_dictation_server.domain.dictation.entity;

import com.corazyarcade.coa_dictation_server.domain.common.BaseEntity;
import com.corazyarcade.coa_dictation_server.domain.programminglanguage.entity.ProgrammingLanguage;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dictation", indexes = {
        @Index(name = "idx_dictation_algorithm", columnList = "dictation_algorithm_id"),
        @Index(name = "idx_dictation_programming_language", columnList = "programming_language_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Dictation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dictation_algorithm_id", nullable = false)
    private DictationAlgorithm dictationAlgorithm;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "programming_language_id", nullable = false)
    private ProgrammingLanguage programmingLanguage;

    @NotBlank
    @Size(max = 100)
    @Column(length = 100, nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
