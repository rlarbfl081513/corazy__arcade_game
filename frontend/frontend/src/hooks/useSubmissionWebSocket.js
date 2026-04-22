// src/hooks/useSubmissionWebSocket.js (새 파일)

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "@/utils/storage";

const WS_BASE_URL = import.meta.env.VITE_SOCKET_URL + "/api/algorithm/ws";

function useSubmissionWebSocket(submissionUuid) {
  const [progress, setProgress] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // 1. submissionUuid가 없으면 아무것도 하지 않습니다.
    if (!submissionUuid) {
      // 이전 상태 초기화
      setProgress(null);
      setTestCases([]);
      setFinalResult(null);
      setError(null);
      setIsComplete(false);
      setIsReady(false);
      return;
    }

    // 2. 새 UUID로 새 WebSocket 연결
    const ws = new WebSocket(`${WS_BASE_URL}/${submissionUuid}`);
    wsRef.current = ws;

    // 3. 상태 초기화
    setProgress(null);
    setTestCases([]);
    setFinalResult(null);
    setError(null);
    setIsComplete(false);
    setIsReady(false);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "ready":
          setIsReady(true);
          console.log("☑️ 웹 소켓 통신 준비 완료.");
          break;

        case "progress":
          setProgress(message);
          break;

        case "testcase":
          // testcase 메시지를 받을 때마다 testCases 배열에 추가
          setTestCases((prev) => [...prev, message.result]);
          break;

        case "testcase_batch":
          // 일괄 전송된 테스트케이스 결과들을 배열에 추가
          setTestCases((prev) => [...prev, ...message.results]);
          break;

        case "result":
          // result 메시지는 중간 결과일 수 있으므로 임시 저장만
          // 최종 결과는 complete에서만 확정
          setFinalResult(message.result);
          break;

        case "error":
          setError(message);
          setIsComplete(true);
          break;

        case "complete":
          // ⭐ complete 메시지에 최종 결과가 포함되어 있으면 사용
          if (message.result) {
            setFinalResult(message.result);
          }
          // complete가 와야만 채점 완료로 간주
          setIsComplete(true);
          ws.close();
          break;
      }
    };

    ws.onopen = () => {
      console.log("WebSocket 연결 완료");
    };

    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error);
      setError({ error: "WebSocket 연결 실패" });
    };

    ws.onclose = (event) => {
      console.log("WebSocket 연결 종료", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    };

    // 4. 컴포넌트 언마운트 시 WebSocket 연결을 정리합니다.
    return () => {
      if (!submissionUuid || isComplete) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      }
    };
  }, [submissionUuid]); // submissionUuid가 변경될 때마다 이 훅이 다시 실행됩니다.

  return { progress, testCases, finalResult, error, isComplete, isReady };
}

export default useSubmissionWebSocket;
