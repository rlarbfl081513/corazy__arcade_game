package com.corazyarcade.coa_auth_server.global.security.jwt;

import com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade;
import com.corazyarcade.coa_auth_server.global.security.userDetails.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtHeaderAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USER_ROLE = "X-User-Role";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String userIdHeader = request.getHeader(HEADER_USER_ID);
            String userRoleHeader = request.getHeader(HEADER_USER_ROLE);

            if (userIdHeader != null && userRoleHeader != null) {
                Long userId = Long.parseLong(userIdHeader);
                MembershipGrade grade = MembershipGrade.valueOf(userRoleHeader);

                CustomUserDetails userDetails = CustomUserDetails.of(userId, "", grade);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.error("JWT Header Authentication Filter error", e);
            // 필요시 인증 실패 처리 로직 추가 가능
        }

        filterChain.doFilter(request, response);
    }
}
