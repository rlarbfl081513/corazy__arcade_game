package com.corazyarcade.coa_auth_server.domain.user.service;

import com.corazyarcade.coa_auth_server.domain.auth.dto.TokenResponse;
import com.corazyarcade.coa_auth_server.domain.auth.service.TokenService;
import com.corazyarcade.coa_auth_server.domain.user.domain.Membership;
import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import com.corazyarcade.coa_auth_server.domain.user.repository.MembershipRepository;
import com.corazyarcade.coa_auth_server.domain.user.repository.UserRepository;
import com.corazyarcade.coa_auth_server.global.annotation.DistributedLock;
import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import static com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade.GUEST;
import static com.corazyarcade.coa_auth_server.domain.user.exception.UserErrorCode.MEMBERSHIP_NOT_FOUND;

@Slf4j
@RequiredArgsConstructor
@Service
public class GuestService {

    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    // Redis 연결 오류로 인한 임시 주석처리 - 분산 락 비활성화
    // @DistributedLock(prefix = "USER", keys = {"#nickname"})
    @org.springframework.transaction.annotation.Transactional
    public TokenResponse createGuestAndSignIn(HttpServletRequest servletRequest, String nickname) {

        Membership membership = membershipRepository.findByGrade(GUEST).orElseThrow(
                () -> new ApplicationException(MEMBERSHIP_NOT_FOUND));

        User guestUser = buildGuestUser(membership, nickname);
        User savedUser = userRepository.save(guestUser);

        return tokenService.issueToken(savedUser, servletRequest);
    }

    private User buildGuestUser(Membership membership, String nickname) {
        return User.builder()
                .membership(membership)
                .nickname(nickname)
                .build();
    }

}
