import './RoomList.css';

/**
 * MVP 버전 - 언어 선택 컴포넌트
 * - JAVA, PYTHON, JAVASCRIPT, C++ 언어 카드 표시
 * - 기존 방 목록 디자인 재사용
 */

function RoomList({
  onLanguageSelect,
}) {
  // MVP: 언어 목록 (방 카드 형태로 표시) - 각 언어별 단색 배경
  // 언어 ID: Python=1, Java=2, Javascript=3, C++=4
  const languages = [
    {
      id: 'java',
      name: 'Java',
      displayName: 'Java',
      color: '#f093fb', // 핑크
      programmingLanguageId: 2, // Java ID
    },
    {
      id: 'python',
      name: 'Python',
      displayName: 'Python',
      color: '#4facfe', // 파란색
      programmingLanguageId: 1, // Python ID
    },
    {
      id: 'javascript',
      name: 'Javascript',
      displayName: 'Javascript',
      color: '#FFD93D', // 노란색
      programmingLanguageId: 3, // Javascript ID
    },
    {
      id: 'cpp',
      name: 'C++',
      displayName: 'C++',
      color: '#43e97b', // 초록색
      programmingLanguageId: 4, // C++ ID
    },
  ];

  return (
    <div className="room-box">
      {/* 새로고침 버튼 제거 (MVP) */}

      {/* 언어 선택 영역 */}
      <div className="rooms-section">
        {/* 타이틀 제거 */}
        <div className="rooms-list">
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="room-card"
              onClick={() => onLanguageSelect(lang.programmingLanguageId, lang.name)}
              style={{ cursor: 'pointer' }}
            >
              {/* 언어 정보 헤더 */}
              <div className="room-info">
                <span className="room-mode">SOLO</span>
                <div className="room-title">{lang.displayName}</div>
                <span className="room-players">1 / 1</span>
              </div>

              {/* 언어 아이콘/이름 표시 영역 */}
              <div className="room-participants">
                <div
                  className="language-display"
                  style={{ backgroundColor: lang.color }}
                >
                  <span className="language-name">{lang.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoomList;
