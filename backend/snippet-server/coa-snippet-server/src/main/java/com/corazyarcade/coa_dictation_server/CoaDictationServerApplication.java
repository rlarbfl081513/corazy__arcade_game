package com.corazyarcade.coa_dictation_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class CoaDictationServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoaDictationServerApplication.class, args);
    }

}
