package com.corazyarcade.coa_auth_server.global.security.userDetails;

import com.corazyarcade.coa_auth_server.domain.user.domain.MembershipGrade;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final MembershipGrade grade;

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(
                new SimpleGrantedAuthority("ROLE_" + grade.name())
        );
    }

    public static CustomUserDetails of(Long userId, String nickname, MembershipGrade grade) {
        return new CustomUserDetails(userId, nickname, grade);
    }
}
