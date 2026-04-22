import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './IntroPage.css';
import { guestLogin, checkAutoLogin } from '@/api/authApi';
import { useToast } from '@/components/Toast';
import { getGoogleOAuthUrl } from '@/config/googleOAuth';
import { initProfanityFilter } from '@/utils/profanityFilter';

import IntroChars from './components/IntroChars';
import IntroBgm from '@/assets/bgm/Intro.mp3';

/**
 * 인트로 랜딩 페이지 컴포넌트
 * - intro_background.png 배경 이미지
 * - 닉네임 입력 (2-20자) 후 Start 버튼으로 게스트 로그인 (JWT 토큰 발급)
 * - accessToken이 있으면 자동 로그인
 */
function IntroPage() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [filterFn, setFilterFn] = useState(null);
  const [filterReady, setFilterReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const logoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      const fn = initProfanityFilter();
      setFilterFn(() => fn);
      setFilterReady(true);
    } catch (err) {
      console.error(err);
      // toast.error('욕설 필터를 로드하지 못했습니다.');
    }
  }, [toast]);

  // 자동 로그인 체크 (userId와 nickname 존재 시)
  useEffect(() => {
    const isLoggedIn = checkAutoLogin();

    if (isLoggedIn) {
      console.log('자동 로그인 성공');
      // 자동 로그인 성공 시 바로 메인 페이지로 이동
      navigate('/main');
    }
  }, [navigate]);

  // 로고 페이드인이 끝나면 배경음악 재생 (조금 늦게)
  useEffect(() => {
    const audio = new Audio(IntroBgm);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    let hasTriedAnimationEnd = false;

    const handleAnimationEnd = (e) => {
      if (e.animationName === 'fadeIn' && !hasTriedAnimationEnd) {
        hasTriedAnimationEnd = true;
        // console.log('Logo fadeIn 끝 → 200ms 후 BGM 재생 시도');

        // 약간의 딜레이 후 재생 시도
        setTimeout(() => {
          audio.play().catch(err => {
            // console.log('딜레이 후 재생 실패 (autoplay 차단됨):', err);
            toast.sound('브라우저의 오디오 자동재생 설정이 꺼져 있어요.');
            toast.sound('화면을 클릭하면 배경음악을 재생해요.');
            // Fallback: 첫 클릭에서 재생
            const playOnClick = () => {
              audio.play().catch(() => {});
              document.removeEventListener('click', playOnClick);
            };
            document.addEventListener('click', playOnClick, { once: true });
          });
        }, 200); // ← 딜레이
      }
    };

    const logoEl = logoRef.current;
    if (logoEl) {
      logoEl.addEventListener('animationend', handleAnimationEnd);
    }

    return () => {
      if (logoEl) {
        logoEl.removeEventListener('animationend', handleAnimationEnd);
      }
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // 닉네임 입력 핸들러
  const handleNicknameChange = useCallback((e) => {
      const raw = e.target.value;
      if (raw.length <= 20){
        setNickname(raw);
      }
    }, []);

  // Start 버튼 클릭 핸들러 (게스트 로그인)
  const handleStart = async () => {
    try {
      setLoading(true);
      const trimmed = nickname.trim();

      // 닉네임 유효성 검사 (2-20자)
      if (!trimmed) {
        toast.warning('닉네임을 입력해주세요.');
        return;
      }
      if (trimmed.length < 2) {
        toast.warning('닉네임은 2자 이상이어야 합니다.');
        return;
      }
      if (trimmed.length > 20) {
        toast.warning('닉네임은 20자 이하여야 합니다.');
        return;
      }

      if (filterFn) {
        const { cleaned, matches } = filterFn(trimmed); // Now destructures
        if (cleaned === '' || cleaned !== trimmed) {
          const badWordsStr = matches.length > 0 ? ` (${matches.join(', ')})` : '';
          toast.warning(`닉네임에 부적절한 단어가 포함되어 있습니다.${badWordsStr}`);
          return;
        }
      }

      // 닉네임 형식 검사: 한글, 영문, 숫자, 밑줄만 허용
      const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
      if (!nicknameRegex.test(trimmed)) {
        toast.warning('닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.');
        return;
      }

      // 게스트 로그인 (JWT 토큰 발급)
      const userData = await guestLogin(trimmed);
      console.log('게스트 로그인 완료:', userData);
      toast.success('로그인 성공!');

      // 메인 페이지로 이동
      navigate('/main');
    } catch (error) {
      console.error('로그인 실패:', error);
      toast.error(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleStart();
    }
  };

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => {
    try {
      // Google OAuth URL로 리다이렉트
      const googleOAuthUrl = getGoogleOAuthUrl();
      window.location.href = googleOAuthUrl;
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      toast.error('구글 로그인에 실패했습니다.');
    }
  };

  const startDisabled = !filterReady || loading || nickname.trim().length < 2;

  return (
    <div className="intro-page">
      {/* 로고 & 캐릭터 */}
      <div className="intro-chars-container">
        <IntroChars logoRef={logoRef} />
      </div>
      <div className="intro-content">
        <h1 className="intro-title" style={{ visibility: 'hidden' }}>Coding Game</h1>
        {/* 게스트 로그인 */}
        <div className="login-section guest-login">
          <input
            type="text"
            className="nickname-input"
            placeholder="닉네임을 입력하세요 (2-20자)"
            value={nickname}
            onChange={handleNicknameChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            maxLength={20}
          />
          <button
            className="start-button guest-button"
            onClick={handleStart}
            disabled={startDisabled}
          >
            {loading ? '로딩 중...' : '게스트 로그인'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="login-divider">
          <span className="divider-text">OR</span>
        </div>

        {/* 구글 로그인 */}
        <button className="google-login-button" onClick={handleGoogleLogin} disabled={loading}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google 로그인
        </button>
      </div>
    </div>
  );
}

export default IntroPage;
