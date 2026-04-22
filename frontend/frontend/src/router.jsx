import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import IntroPage from '@/page/IntroPage/IntroPage';
import MainPage from '@/page/MainPage/MainPage';
import RoomPage from '@/page/RoomPage/RoomPage';
import DictationPage from '@/page/DictationPage/DictationPage';
import ChallengePage from '@/page/ChallengePage/ChallengePage';
import RelayGamePage from '@/page/RelayGamePage/RelayGamePage';
import GoogleCallbackPage from '@/page/GoogleCallbackPage/GoogleCallbackPage';

export const router = createBrowserRouter([
  /* ---------- 레이아웃이 없는 페이지 ---------- */

  /* 기본 경로 / -> IntroPage */
  { path: '/', element: <IntroPage /> },

  /* /auth/google/callback -> GoogleCallbackPage */
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },

  /* ---------- 레이아웃이 있는 페이지 ---------- */
  {
    element: <AppLayout />,
    children: [

      /* /main -> MainPage */
      { path: '/main', element: <MainPage /> },

      /* /dictation -> DictationPage */
      {
        path: '/dictation',
        element: <DictationPage />,
        loader: () => ({ gameMode: 'dictation' }),
      },

      /* /challenge/:problemId? -> ChallengePage */
      {
        path: '/challenge/:problemId?',
        element: <ChallengePage />,
        loader: () => ({ gameMode: 'challenge' }),
      },
      
      /* /room/:roomId -> RoomPage */
      {
        path: '/room/:roomId',
        element: <RoomPage />,
        loader: () => ({ gameMode: 'relay' }),
      },
      
     /* /game/:roomId -> RelayGamePage */
      {
        path: '/game/:roomId',
        element: <RelayGamePage />,
        loader: () => ({ gameMode: 'relay' }),
      },
    ],
  },
]);