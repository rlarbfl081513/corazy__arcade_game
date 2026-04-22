package com.corazyarcade.coa_main_server.global.filter;

import com.corazyarcade.coa_main_server.global.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        super(Config.class);
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String requestUri = request.getURI().toString();
            String clientIp = getClientIp(request);
            String userAgent = request.getHeaders().getFirst(HttpHeaders.USER_AGENT);

            log.info("====== JWT Filter Start ======");
            log.info("Request URI: {}", requestUri);
            log.info("Request Path: {}", request.getURI().getPath());
            log.info("Request Query: {}", request.getURI().getQuery());
            log.info("Client IP: {}", clientIp);
            log.info("User-Agent: {}", userAgent);
            log.debug("Processing request - URI: {}, IP: {}, User-Agent: {}", requestUri, clientIp, userAgent);

            // 1. Authorization 헤더에서 JWT 추출
            String token = extractToken(request);
            log.info("Token extracted: {}", token != null ? "YES" : "NO");

            if (token == null || token.isEmpty()) {
                log.warn("[JWT_MISSING] No Authorization header or Bearer token found | " +
                        "URI: {} | IP: {} | User-Agent: {}", requestUri, clientIp, userAgent);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            log.debug("JWT token extracted successfully - Token: {}", maskToken(token));

            // 2. JWT 검증
            if (!jwtTokenProvider.validateToken(token)) {
                log.warn("[JWT_INVALID] Token validation failed | " +
                                "URI: {} | IP: {} | Token: {} | User-Agent: {}",
                        requestUri, clientIp, maskToken(token), userAgent);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                // 3. JWT 파싱하여 Claims 추출
                Claims claims = jwtTokenProvider.parseClaims(token);

                // 4. 필수 Claim 추출 및 검증
                String userId = claims.get("user_id", String.class);
                String nickname = claims.get("nickname", String.class);

                if (userId == null || userId.isEmpty()) {
                    log.error("[JWT_CLAIM_MISSING] user_id claim is missing or empty | " +
                                    "URI: {} | IP: {} | Token: {} | Claims: {}",
                            requestUri, clientIp, maskToken(token), claims.keySet());
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                if (nickname == null || nickname.isEmpty()) {
                    log.error("[JWT_CLAIM_MISSING] nickname claim is missing or empty | " +
                                    "URI: {} | IP: {} | Token: {} | Claims: {}",
                            requestUri, clientIp, maskToken(token), claims.keySet());
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                log.info("[JWT_SUCCESS] Authentication successful | " +
                                "UserId: {} | Nickname: {} | URI: {} | IP: {}",
                        userId, nickname, requestUri, clientIp);

                // 5. 웹소켓 요청인지 확인하여 처리 방식 결정
                ServerHttpRequest modifiedRequest;

                boolean isWs = isWebSocketRequest(request);
                log.info("Is WebSocket request: {}", isWs);

                if (isWs) {
                    // 웹소켓: 쿼리 파라미터로 userId, nickname 추가
                    // 한글 nickname을 먼저 URL 인코딩
                    String encodedNickname = URLEncoder.encode(nickname, StandardCharsets.UTF_8);

                    URI newUri = UriComponentsBuilder.fromUri(request.getURI())
                            .queryParam("userId", userId)
                            .queryParam("nickname", encodedNickname)
                            .build(false)  // 이미 인코딩했으므로 추가 인코딩 방지
                            .toUri();

                    modifiedRequest = request.mutate()
                            .uri(newUri)
                            .build();

                    log.info("[WEBSOCKET] Query parameters added - userId: {}, nickname: {} (encoded: {})",
                            userId, nickname, encodedNickname);
                    log.info("[WEBSOCKET] New URI: {}", newUri);
                    log.debug("[WEBSOCKET] Query parameters added - userId: {}, nickname: {}, URI: {}",
                            userId, encodedNickname, newUri);
                } else {
                    // 일반 HTTP: 헤더로 userId, nickname 추가
                    // HTTP 헤더는 ISO-8859-1만 지원하므로 한글은 URL 인코딩 필요
                    String encodedNickname = URLEncoder.encode(nickname, StandardCharsets.UTF_8);

                    modifiedRequest = request.mutate()
                            .header("X-User-Id", userId)
                            .header("X-User-Nickname", encodedNickname)
                            .build();

                    log.info("[HTTP] Request headers modified - X-User-Id: {}, X-User-Nickname: {} (encoded: {})",
                            userId, nickname, encodedNickname);
                    log.debug("[HTTP] Request headers modified - X-User-Id: {}, X-User-Nickname: {}", userId, encodedNickname);
                }

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (ClassCastException e) {
                log.error("[JWT_CLAIM_TYPE_ERROR] Claim type casting failed | " +
                                "URI: {} | IP: {} | Token: {} | Error: {}",
                        requestUri, clientIp, maskToken(token), e.getMessage(), e);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            } catch (Exception e) {
                log.error("[JWT_PARSE_ERROR] Unexpected error while parsing JWT | " +
                                "URI: {} | IP: {} | Token: {} | Exception: {} | Message: {}",
                        requestUri, clientIp, maskToken(token),
                        e.getClass().getSimpleName(), e.getMessage(), e);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        };
    }

    /**
     * JWT 토큰 추출
     * 1. Authorization 헤더에서 Bearer 토큰 추출 시도
     * 2. 쿼리 파라미터 'token'에서 추출 시도 (Socket.IO 등)
     * @param request HTTP 요청
     * @return JWT 토큰 (Bearer 제외)
     */
    private String extractToken(ServerHttpRequest request) {
        // 1. Authorization 헤더에서 추출
        String bearerToken = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (bearerToken != null) {
            if (bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            } else {
                log.warn("Authorization header does not start with 'Bearer ' - Value: {}",
                        bearerToken.substring(0, Math.min(20, bearerToken.length())));
            }
        }

        // 2. 쿼리 파라미터에서 추출 (Socket.IO 용)
        String tokenParam = request.getQueryParams().getFirst("token");
        if (tokenParam != null && !tokenParam.isEmpty()) {
            log.debug("Token extracted from query parameter");
            return tokenParam;
        }

        log.debug("No token found in Authorization header or query parameter");
        return null;
    }

    /**
     * 클라이언트 IP 주소 추출
     * X-Forwarded-For 헤더를 먼저 확인하고, 없으면 remoteAddress 사용
     * @param request HTTP 요청
     * @return 클라이언트 IP 주소
     */
    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For는 "client, proxy1, proxy2" 형식일 수 있으므로 첫 번째 값 사용
            return xForwardedFor.split(",")[0].trim();
        }

        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }

        return "unknown";
    }

    /**
     * 웹소켓 요청인지 확인
     * 1. HTTP Upgrade 헤더를 확인하여 웹소켓 핸드셰이크 요청인지 판단
     * 2. Socket.IO 요청 (EIO 쿼리 파라미터) 확인
     * 3. SockJS 요청 (경로 기반) 확인
     * @param request HTTP 요청
     * @return 웹소켓 요청이면 true
     */
    private boolean isWebSocketRequest(ServerHttpRequest request) {
        // 1. 일반 WebSocket 요청 확인 (Upgrade 헤더)
        String upgrade = request.getHeaders().getFirst(HttpHeaders.UPGRADE);
        String connection = request.getHeaders().getFirst(HttpHeaders.CONNECTION);

        boolean isWebSocket = "websocket".equalsIgnoreCase(upgrade) &&
                (connection != null && connection.toLowerCase().contains("upgrade"));

        if (isWebSocket) {
            log.debug("WebSocket handshake detected - Upgrade: {}, Connection: {}", upgrade, connection);
            return true;
        }

        // 2. Socket.IO 요청 확인 (EIO 쿼리 파라미터 존재)
        String query = request.getURI().getRawQuery();
        if (query != null && query.contains("EIO=")) {
            log.debug("Socket.IO request detected - Query: {}", query);
            return true;
        }

        // 3. SockJS 요청 확인 (경로 기반)
        String path = request.getURI().getPath();
        if (path != null && (path.contains("/ws/") || path.endsWith("/info") || path.contains("/websocket"))) {
            log.debug("SockJS request detected - Path: {}", path);
            return true;
        }

        return false;
    }

    /**
     * 토큰을 마스킹하여 로그에 안전하게 출력
     * @param token JWT 토큰
     * @return 마스킹된 토큰
     */
    private String maskToken(String token) {
        if (token == null) {
            return "null";
        }
        if (token.isEmpty()) {
            return "empty";
        }
        if (token.length() <= 8) {
            return "****";
        }
        return token.substring(0, 4) + "..." + "****";
    }

    public static class Config {
        // 필요시 설정값 추가 가능
    }
}
