import { useState, useEffect, useRef } from 'react'
import { ToastProvider } from '@/components/Toast'
import { Routes, Route, RouterProvider } from 'react-router-dom'
import { router } from '@/router.jsx';
import './App.css'
import 'katex/dist/katex.min.css'
import { motion } from 'framer-motion'
import { SettingsModalProvider } from './context/SettingsModalContext';
import useGameStore from '@/stores/gameStore';
import { getUserInfo } from '@/utils/storage';

// 프로덕션 환경에서 콘솔 로그 비활성화
if (process.env.NODE_ENV === "production") {
  if (typeof console !== "undefined") {
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
  }
}

/**
 * 메인 앱 컴포넌트
 * React Router를 사용한 페이지 라우팅 구현
 */
function App() {
  const { setMyInfo } = useGameStore();

  // 앱 로드 시 사용자 정보를 gameStore에 초기화
  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.userId) {
      setMyInfo({ userId: userInfo.userId, nickname: userInfo.nickname });
    }
  }, [setMyInfo]);

  /* 개발자 도구 방지 */
  useEffect(() => {
    // 우클릭 방지
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    // 키보드 단축키 방지
    const handleKeyDown = (event) => {
      // F12
      if (event.key === 'F12') {
        event.preventDefault();
      }
      // Ctrl + Shift + I (Windows/Linux)
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
      }
      // Command + Option + I (Mac)
      if (event.metaKey && event.altKey && event.key === 'I') {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
      <SettingsModalProvider>
        <ToastProvider>
          {/* React Router 라우팅 */}
          <RouterProvider router={router} />
        </ToastProvider>
      </SettingsModalProvider>
  );
}

export default App