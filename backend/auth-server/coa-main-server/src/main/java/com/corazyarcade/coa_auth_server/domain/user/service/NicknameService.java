package com.corazyarcade.coa_auth_server.domain.user.service;

import com.corazyarcade.coa_auth_server.domain.user.domain.User;
import com.corazyarcade.coa_auth_server.domain.user.repository.UserRepository;
import com.corazyarcade.coa_auth_server.global.annotation.DistributedLock;
import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static com.corazyarcade.coa_auth_server.domain.user.exception.UserErrorCode.DUPLICATE_NICKNAME;
import static com.corazyarcade.coa_auth_server.domain.user.exception.UserErrorCode.NICKNAME_CREATION_FAILED;
import static com.corazyarcade.coa_auth_server.domain.user.exception.UserErrorCode.USER_NOT_FOUND;

@Slf4j
@RequiredArgsConstructor
@Service
public class NicknameService {

    private static final String NICKNAME_PREFIX = "User";
    private static final int MAX_RETRY_NICKNAME_CREATION = 5;

    private final UserRepository userRepository;


    public String createRandomNickname() {
        for (int i = 0; i < MAX_RETRY_NICKNAME_CREATION; i++) {
            String createdNickname = NICKNAME_PREFIX + UUID.randomUUID().toString().substring(0, 5);

            if (!userRepository.existsByNickname(createdNickname)) {
                return createdNickname;
            }
        }
        throw new ApplicationException(NICKNAME_CREATION_FAILED);
    }

    // Redis 연결 오류로 인한 임시 주석처리 - 분산 락 비활성화
    // @DistributedLock(prefix = "USER", keys = {"#nickname"})
    @Transactional
    public void modifyNickname(Long userId, String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            throw new ApplicationException(DUPLICATE_NICKNAME, nickname);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new ApplicationException(USER_NOT_FOUND));
        user.modifyNickname(nickname);
    }
}
