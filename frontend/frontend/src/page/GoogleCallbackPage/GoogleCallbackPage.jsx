import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';
import { googleLogin } from '@/api/authApi';
import './GoogleCallbackPage.css';

/**
 * Google OAuth 콜백 페이지
 * - URL에서 인가 코드(code) 추출
 * - 먼저 nickname 없이 로그인 시도 (기존 사용자 체크)
 * - 신규 사용자인 경우에만 닉네임 입력 받기
 * - googleLogin API 호출하여 JWT 토큰 발급
 */
function GoogleCallbackPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState(null);
  const [sessionToken, setSessionToken] = useState(null); // 백엔드에서 받은 임시 세션 토큰
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsNickname, setNeedsNickname] = useState(false); // 닉네임 입력 필요 여부
  const [isCheckingUser, setIsCheckingUser] = useState(true); // 사용자 확인 중

  // URL에서 인가 코드 추출 및 자동 로그인 시도
  useEffect(() => {
    /**
     * 기존 사용자인지 확인 (nickname 없이 로그인 시도)
     */
    const checkExistingUser = async (authCode) => {
      try {
        setIsCheckingUser(true);

        // nickname 없이 로그인 시도
        const userData = await googleLogin(authCode);

        console.log('기존 사용자 로그인 성공:', userData);
        toast.success(`환영합니다, ${userData.nickname}님!`);

        // 메인 페이지로 이동
        navigate('/main');
      } catch (error) {
        // NICKNAME_REQUIRED 에러 체크 (여러 형식 지원)
        const errorData = error.response?.data;
        const errorCode = errorData?.error || errorData?.errorCode || errorData?.code;
        const status = error.response?.status;

        // 신규 사용자 판별: NICKNAME_REQUIRED 에러 또는 특정 메시지
        const isNicknameRequired =
          errorCode === 'NICKNAME_REQUIRED' ||
          errorData?.message?.includes('닉네임') ||
          (status === 400 && errorData?.error === 'NICKNAME_REQUIRED');

        if (isNicknameRequired) {
          // 백엔드에서 제공한 sessionToken 저장 (중요!)
          if (errorData?.sessionToken) {
            setSessionToken(errorData.sessionToken);
            console.log('sessionToken 저장됨:', errorData.sessionToken);
          } else {
            console.warn('백엔드에서 sessionToken을 제공하지 않았습니다.');
          }

          setNeedsNickname(true);
          setIsCheckingUser(false);
          return;
        }

        // 그 외 에러
        console.error('로그인 확인 실패:', error);
        const errorMessage = errorData?.message || error.message || '로그인에 실패했습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsCheckingUser(false);

        // 3초 후 인트로 페이지로 이동
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('구글 로그인이 취소되었습니다.');
      toast.error('구글 로그인이 취소되었습니다.');
      setIsCheckingUser(false);
      // 3초 후 인트로 페이지로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
      return;
    }

    if (!authCode) {
      setError('인가 코드가 없습니다.');
      toast.error('잘못된 접근입니다.');
      setIsCheckingUser(false);
      setTimeout(() => {
        navigate('/');
      }, 3000);
      return;
    }

    setCode(authCode);
    // code를 받았으면 즉시 기존 사용자 확인 시도
    checkExistingUser(authCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 닉네임 입력 핸들러
  const handleNicknameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setNickname(value);
    }
  };

  // 닉네임 등록 및 로그인 완료 핸들러 (신규 사용자)
  const handleComplete = async () => {
    try {
      setLoading(true);

      // 닉네임 유효성 검사 (2-20자)
      if (!nickname.trim()) {
        toast.warning('닉네임을 입력해주세요.');
        return;
      }

      const trimmedNickname = nickname.trim();

      if (trimmedNickname.length < 2) {
        toast.warning('닉네임은 2자 이상이어야 합니다.');
        return;
      }

      if (trimmedNickname.length > 20) {
        toast.warning('닉네임은 20자 이하여야 합니다.');
        return;
      }

      // 닉네임 형식 검사: 한글, 영문, 숫자, 밑줄만 허용
      const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
      if (!nicknameRegex.test(trimmedNickname)) {
        toast.warning('닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.');
        return;
      }

      // 구글 로그인 API 호출 (nickname 포함)
      // sessionToken이 있으면 sessionToken 사용, 없으면 code 사용 (하위 호환)
      const authParam = sessionToken || code;

      if (!authParam) {
        toast.error('인증 정보가 없습니다. 다시 시도해주세요.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
        return;
      }

      console.log('로그인 요청:', sessionToken ? 'sessionToken 사용' : 'code 사용');
      const userData = await googleLogin(authParam, trimmedNickname);
      console.log('신규 사용자 로그인 완료:', userData);

      toast.success(`환영합니다, ${userData.nickname}님!`);

      // 메인 페이지로 이동
      navigate('/main');
    } catch (error) {
      console.error('구글 로그인 실패:', error);

      // sessionToken 만료 체크 (AUTH-400-03)
      const errorCode = error.response?.data?.code;
      if (errorCode === 'AUTH-400-03') {
        toast.error('인증 시간이 만료되었습니다. 다시 로그인해주세요.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
        return;
      }

      toast.error(error.message || '로그인에 실패했습니다.');

      // 3초 후 인트로 페이지로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && code) {
      handleComplete();
    }
  };

  // 사용자 확인 중이거나 에러가 있는 경우
  if (isCheckingUser || error || !code) {
    return (
      <div className="google-callback-page">
        <div className="callback-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{error || '로그인 처리 중...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // 신규 사용자 - 닉네임 입력 필요
  if (needsNickname) {
    return (
      <div className="google-callback-page">
        <div className="callback-content">
          <h1 className="callback-title">Welcome!</h1>
          <p className="callback-description">
            처음 방문하신 것을 환영합니다!<br />
            사용할 닉네임을 입력해주세요.
          </p>

          <input
            type="text"
            className="nickname-input"
            placeholder="닉네임을 입력하세요 (2-20자)"
            value={nickname}
            onChange={handleNicknameChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            maxLength={20}
            autoFocus
          />

          <button
            className="complete-button"
            onClick={handleComplete}
            disabled={loading || nickname.trim().length < 2}
          >
            {loading ? 'LOADING...' : 'COMPLETE'}
          </button>
        </div>
      </div>
    );
  }

  // 기존 사용자는 자동으로 로그인되므로 이 화면이 표시되지 않음
  return null;
}

export default GoogleCallbackPage;
