package com.corazyarcade.coa_auth_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@ConfigurationPropertiesScan
@SpringBootApplication
public class CoaAuthServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoaAuthServerApplication.class, args);
    }

}
