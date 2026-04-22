import { useState, useEffect, useRef } from 'react';
import styles from './ChatSidebar.module.css';

/**
 * 오른쪽 하단 채팅 사이드바 컴포넌트
 * - 채팅 메시지 목록
 * - 채팅 입력 및 전송
 * - 자동 스크롤 (최신 메시지)
 */
function ChatSidebar({ chatMessages, onSendChat, title }) {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null); // 스크롤 위치 참조

  // 전송버튼 눌렀을때 확인하는 플래그
  const isSending = useRef(false);

  // 자동으로 아래로 스크롤되게하기
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  };

  // 처음 메시지 로드 시 스크롤 다운
  const hasScrolledInitially = useRef(false);
  useEffect(() => {
    // 메시지가 있고 아직 초기 스크롤을 하지 않았다면
    if (chatMessages.length > 0 && !hasScrolledInitially.current) {
      scrollToBottom();
      hasScrolledInitially.current = true;
    }
  }, [chatMessages]);

  // 조건부 스크롤 로직으로 변경
  useEffect(() => {
    // "내가 전송 버튼을 눌러서(isSending이 true)" 메시지 목록이 변했을 때만 스크롤
    if (isSending.current) {
      scrollToBottom();
      isSending.current = false; // 스크롤 했으니 다시 플래그를 끕니다.
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // [수정 4] 전송 버튼을 누르는 순간 "나 지금 보낸다!"라고 표시
      isSending.current = true; 
      
      onSendChat(chatInput);
      setChatInput('');
    }
  };


  return (
    // 모든 className을 styles['...'] 형식으로 변경
    <div className={styles['bottom-sidebar']}>
      <div className={styles['chat-section']}>
        <div className={styles['title-box']}>
          <div className={styles['title']}>{title || 'Chat Board'}</div>
        </div>
        <div className={styles['line']}></div>
        <div className={styles['chat-messages']}>
          {chatMessages.map((msg) => (
            <div key={msg.id} className={styles['chat-message']}>
              <span title={msg.user} className={styles['chat-user']}>{msg.user}</span>
              <div className={styles['vertical-line']}></div>
              <span className={styles['chat-text']}>{msg.message}</span>
            </div>
          ))}
          {/* 스크롤 타겟 (보이지 않는 요소) */}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className={styles['chat-input-form']}>
          <input
            type="text"
            className={styles['chat-input']}
            placeholder=""
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={1}
            maxLength={200}
          />
          <button type="submit" className={styles['chat-send-btn']}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatSidebar;