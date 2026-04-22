package com.corazyarcade.coa_auth_server.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApiDocsConfig {

    private final String jwtSchemaName = "bearerAuth";
    private final String userIdHeaderName = "X-User-Id";
    private final String userRoleHeaderName = "X-User-Role";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(createApiInfo())
                .addSecurityItem(createSecurityRequirement())
                .components(createComponents());
    }

    private Info createApiInfo() {
        return new Info()
                .title("CorageArcade-Auth API")
                .description("CorageArcade-Auth API 문서입니다.")
                .version("1.0.0");
    }

    private SecurityRequirement createSecurityRequirement() {
        return new SecurityRequirement()
                .addList(jwtSchemaName)
                .addList(userIdHeaderName)
                .addList(userRoleHeaderName);
    }

    private Components createComponents() {
        return new Components()
                .addSecuritySchemes(jwtSchemaName, new SecurityScheme()
                        .name(jwtSchemaName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .in(SecurityScheme.In.HEADER)
                        .name("Authorization"))
                .addSecuritySchemes(userIdHeaderName, new SecurityScheme()
                        .name(userIdHeaderName)
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name(userIdHeaderName))
                .addSecuritySchemes(userRoleHeaderName, new SecurityScheme()
                        .name(userRoleHeaderName)
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name(userRoleHeaderName));
    }
}
