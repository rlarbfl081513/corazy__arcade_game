package com.corazyarcade.coa_auth_server.domain.user.controller;

import com.corazyarcade.coa_auth_server.domain.auth.dto.TokenResponse;
import com.corazyarcade.coa_auth_server.domain.user.dto.GuestLoginRequest;
import com.corazyarcade.coa_auth_server.domain.user.service.GuestService;
import com.corazyarcade.coa_auth_server.domain.user.service.NicknameService;
import com.corazyarcade.coa_auth_server.global.security.userDetails.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "회원 관리", description = "회원 관련 API")
@Slf4j
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@RestController
public class UserController {

    private final GuestService guestService;
    private final NicknameService nicknameService;

    @Operation(summary = "GUEST 생성", description = "닉네임으로 GUEST 계정을 생성하고 access/refresh token을 발행합니다.")
    @PostMapping("/guest")
    public ResponseEntity<TokenResponse> guestSignIn(
            @Valid @RequestBody GuestLoginRequest request,
            HttpServletRequest servletRequest) {
        TokenResponse signInResponse = guestService.createGuestAndSignIn(servletRequest, request.getNickname());

        return ResponseEntity.ok(signInResponse);
    }

    @Operation(summary = "닉네임 변경", description = "지정한 닉네임으로 중복 확인 후 정보를 수정합니다.")
    @PostMapping("/modify/nickname/{nickname}")
    public ResponseEntity<Void> modifyNickname(@AuthenticationPrincipal CustomUserDetails userDetails,
                                               @Parameter(description = "수정할 닉네임", required = true, example = "코아")
                                               @PathVariable
                                               @NotBlank
                                               @Size(min = 2, max = 10)
                                               @Pattern(regexp = "^[가-힣a-zA-Z0-9_]+$", message = "한글, 영문, 숫자, 밑줄만 허용됩니다.")
                                               String nickname) {
        nicknameService.modifyNickname(userDetails.getUserId(), nickname);
        return ResponseEntity.noContent().build();
    }
}
