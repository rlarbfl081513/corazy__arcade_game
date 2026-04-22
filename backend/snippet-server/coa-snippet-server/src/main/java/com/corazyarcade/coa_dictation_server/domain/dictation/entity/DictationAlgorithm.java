package com.corazyarcade.coa_dictation_server.domain.dictation.entity;

import com.corazyarcade.coa_dictation_server.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dictation_algorithm", indexes = {
        @Index(name = "uk_dictation_algorithm_name", columnList = "name", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DictationAlgorithm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT")
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Builder
    public DictationAlgorithm(String name) {
        this.name = name;
    }

    public void update(String name) {
        this.name = name;
    }
}
