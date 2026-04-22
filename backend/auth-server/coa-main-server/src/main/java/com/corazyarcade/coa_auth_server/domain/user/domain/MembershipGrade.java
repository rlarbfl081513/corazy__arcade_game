package com.corazyarcade.coa_auth_server.domain.user.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MembershipGrade {
    GUEST("게스트"),
    BASIC("기본 회원"),
    BRONZE("Bronze 회원"),
    SILVER("Silver 회원"),
    GOLD("Gold 회원"),
    PLATINUM("Platinum 회원"),
    ADMIN("관리자");

    private final String description;
}
