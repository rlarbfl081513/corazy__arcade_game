package com.corazyarcade.coa_auth_server.global.security.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "spring.jwt")
public class JwtProperties {
    private String secret;
    private Long accessTokenValidityInMs;
    private Long refreshTokenValidityInMs;
}
