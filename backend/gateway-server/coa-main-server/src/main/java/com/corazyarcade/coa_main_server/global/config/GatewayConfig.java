package com.corazyarcade.coa_main_server.global.config;

import com.corazyarcade.coa_main_server.global.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${AUTH_SERVER_URL}")
    private String authServerUrl;

    @Value("${RANKING_SERVER_URL}")
    private String rankingServerUrl;

    @Value("${DICTATION_SERVER_URL}")
    private String dictationServerUrl;

    @Value("${CHAT_SERVER_URL}")
    private String chatServerUrl;

    @Value("${RELAY_SERVER_URL}")
    private String relayServerUrl;

    @Value("${ALGORITHM_SERVER_URL}")
    private String algorithmServerUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        log.info("Configuring Spring Cloud Gateway routes with JWT authentication filter");

        return builder.routes()
                // Auth Server Route - JWT 검증 제외 (로그인/회원가입 등을 위해)
                .route("auth-server-route", r -> r
                        .path("/api/auth/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader())
                        .uri(authServerUrl))

                // Ranking Server Route - JWT 검증 적용
                .route("ranking-server-route", r -> r
                        .path("/api/ranking/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(
                                        new JwtAuthenticationFilter.Config())))
                        .uri(rankingServerUrl))

                // Dictation Server Route - JWT 검증 적용
                .route("dictation-server-route", r -> r
                        .path("/api/dictations/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(
                                        new JwtAuthenticationFilter.Config())))
                        .uri(dictationServerUrl))

                // Chat Messages Route - JWT 검증 적용, HTTP 헤더로 전달
                .route("chat-messages-route", r -> r
                        .path("/api/messages/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(
                                        new JwtAuthenticationFilter.Config())))
                        .uri(chatServerUrl))

                // Chat Server Route - JWT 검증 적용, Socket.IO (쿼리 파라미터로 전달)
                .route("chat-server-route", r -> r
                        .path("/api/chat/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(
                                        new JwtAuthenticationFilter.Config())))
                        .uri(chatServerUrl))
                .route("algorithm-server-ws", r -> r
                        .path("/api/algorithm/**")
                        .and()
                        .header("Upgrade", "websocket")
                        .filters(f -> f
                                .removeRequestHeader("Cookie"))
                        .metadata("response-timeout", 600000)
                        .uri("ws://" + algorithmServerUrl.replace("http://", "")))
                .route("algorithm-server-route", r -> r
                        .path("/api/algorithm/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri(algorithmServerUrl))
                .route("problem-server-route", r -> r
                        .path("/api/problem/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(
                                        new JwtAuthenticationFilter.Config())))
                        .uri(algorithmServerUrl))

                // Relay Server Route - JWT 검증 적용
                .route("relay-server-route", r -> r
                        .path("/api/relay/**")
                        .filters(f -> f
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader()
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri(relayServerUrl))

                // Relay Server - SockJS Route
                // SockJS는 /info 등의 HTTP 요청을 먼저 보내므로 http:// 프로토콜 사용
                // Gateway가 WebSocket handshake를 자동으로 감지하여 WS로 업그레이드함
                .route("relay-ws-route", r -> r
                        .path("/api/ws/relay/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .removeRequestHeader("Cookie")
                                .preserveHostHeader() // 원본 호스트 헤더 유지 (CORS / SockJS 핸드셰이크에 중요)
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri(relayServerUrl))



                .build();
    }
}
