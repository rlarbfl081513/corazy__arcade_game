import './WaitingRoom.css';
import relayModeLabel from '@/page/MainPage/assets/relay_mode_label.png';
import cppLogo from '@/assets/lang/cpp.png';
import jsLogo from '@/assets/lang/js.png';
import pythonLogo from '@/assets/lang/python.png';
import javaLogo from '@/assets/lang/java.png';
import host from '@/assets/icon/hostCrown.png';

/**
 * 방 카드 컴포넌트
 * - 개별 방 정보 표시
 * - 네오 브루탈리즘 스타일
 */

function RoomCard({ room, onClick }) {
  const {
    roomName,
    hostNickname,
    problemNumber,
    problemTitle,
    languageName,
    maxParticipants,
    currentParticipants,
    status,
  } = room;

  // 언어별 이미지가 들어가도록
  const getImageUrl = (lang) => {
    switch (lang) {
      case 'C++':
        return cppLogo; // public 폴더 기준
      case 'Java':
        return javaLogo;
      case 'Javascript':
        return jsLogo;
      case 'Python':
        return pythonLogo;
    }
  };

  // 💡 언어 이름을 CSS가 이해할 수 있는 이름으로 바꿔주는 객체
  const languageClassMap = {
    'C++': 'cpp',
    'Java': 'java',
    'Javascript': 'js',
    'Python': 'python',
  };

  // 상태별 표시 텍스트 및 색상
  const getStatusInfo = () => {
    switch (status) {
      case 'WAITING':
        return { text: '대기중', color: '#ffffffff' }; // 파란색
      case 'IN_PROGRESS':
        return { text: '게임중', color: '#FFD93D' }; // 노란색
      case 'COMPLETED':
        return { text: '완료', color: '#43e97b' }; // 초록색
      default:
        return { text: '알 수 없음', color: '#CCCCCC' }; // 회색
    }
  };

  const statusInfo = getStatusInfo();

  // 방이 가득 찼는지 확인
  const isFull = currentParticipants >= maxParticipants;

  // 클릭 가능 여부 (대기중이면서 자리가 있는 경우만)
  const isClickable = status === 'WAITING' && !isFull;

  return (
    <div
      className={`room-card ${!isClickable ? 'room-card-disabled' : ''}`}
      onClick={isClickable ? onClick : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'not-allowed', backgroundColor: statusInfo.color }}
    >
      {/* 방 정보 헤더 */}
      <div className="mode-label">
        <img src={relayModeLabel} alt="" />
      </div>
      <div className="room-img">
        <img
          src={getImageUrl(languageName)}
          alt={`${languageName} 방 이미지`}
        />
      </div>
      <div className="room-info">
         {/* 문제 정보 */}
         <div className="title-host">
            <span className="room-title">{roomName}</span>
            {/* <span className="problem-title">
              {problemTitle.replace(" null", "")}
            </span> */}
            <div className="room-host">
              <img src={host} />
              {hostNickname}
            </div>
         </div>
        <div className="lang-person">
          <span className={`participants-count ${isFull ? 'full' : ''}`}>
                {currentParticipants} / {maxParticipants}
          </span>
          <span className={`language-badge lang-${languageClassMap[languageName]}`}>{languageName}</span>  
        </div>        
        {/* <div className="room-meta">
          <span
            className="room-status-badge"
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.text}
          </span>
        </div> */}
      </div>

    </div>
  );
}

export default RoomCard;
