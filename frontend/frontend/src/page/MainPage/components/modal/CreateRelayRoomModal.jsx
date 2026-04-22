import { useState, useEffect } from 'react';
import './ProblemGameStartModal.css';
import OptionButtons from '@/components/buttons/OptionButtons';
import { getAlgorithms } from '@/api/problemApi';
import { getLanguages } from '@/api/problemApi';

/**
 * 방 생성 모달 컴포넌트
 * - 방 이름, 문제 번호, 문제 제목, 언어, 최대 인원 입력
 */
function CreateRoomModal({ isOpen, onClose, onConfirm }) {
  const [roomName, setRoomName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Java');
  const [maxParticipants, setMaxParticipants] = useState(4);

  // api 응답을 저장할 state 추가
  const [languageOptions, setLanguageOptions] = useState([]);

    // 로딩 및 에러 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // userEffect를 사용해 문제 api를 호출
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // api호출 및 데이터변환
          const langData = await getLanguages();

          // {id, name} 형태로 변화
          const formattedLanguages = langData.map(lang => ({
            id : lang.id,
            name : lang.language
          }));;

          // 변환된 데이터를 state에 저장
          setLanguageOptions(formattedLanguages);

          // 데이터 로드 후 첫 번째 항목을 기본값으로 설정
          if (formattedLanguages.length > 0) {
            setSelectedLanguage(formattedLanguages[0].name);
          }

        } catch (err) {
          console.error("데이터 로드 실패:", err);
          setError("옵션을 불러오는 데 실패했습니다.");
        } finally {
          setIsLoading(false); // 로딩 종료
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // 최대 인원 옵션 (2-4명)
  const participantOptions = [
    { id: 2, name: 2 },
    { id: 3, name: 3 },
    { id: 4, name: 4 }
  ];

  // 모달 닫기 및 초기화
  const handleClose = () => {
    setRoomName('');
    setSelectedLanguage('Java');
    setMaxParticipants(4);
    onClose();
  };

  // 방 생성 확인
  const handleCreate = () => {
    // Validation
    if (!roomName.trim()) {
      alert('방 이름을 입력해주세요!');
      return;
    }

    if (roomName.length < 1 || roomName.length > 13) {
      alert('방 이름은 1-20자 사이여야 합니다!');
      return;
    }

    // 선택된 언어의 ID 찾기
    const langObj = languageOptions.find(lang => lang.name === selectedLanguage);

    // 방 생성 데이터
    const roomData = {
      roomName: roomName.trim(),
      languageId: langObj.id,
      languageName: langObj.name,
      maxParticipants,
    };

    onConfirm(roomData);
    handleClose();
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="header-box">
          <div className="icon-box"></div>
          <h2>Create Relay Room</h2>
          <div className="icon-box">
            <button className="modal-btn-cancel-icon" onClick={handleClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="option-box">
          {/* 방 이름 */}
          <div className="modal-field">
            <label htmlFor="room-name">방 이름</label>
            <input
              id="room-name"
              type="text"
              className="modal-input"
              placeholder="방 이름 (1-13자)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={13}
            />
          </div>

          {/* 언어 선택 */}
          <div className="modal-field">
            <label>언어</label>
            <OptionButtons
              options={languageOptions}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
            />
          </div>

          {/* 최대 인원 */}
          <div className="modal-field">
            <label>최대 인원</label>
            <OptionButtons
              options={participantOptions}
              value={maxParticipants}
              onChange={setMaxParticipants}
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="modal-buttons">
          <button className="modal-btn-confirm" onClick={handleCreate}>
            방 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
