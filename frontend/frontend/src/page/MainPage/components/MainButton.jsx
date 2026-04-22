import './MainButton.css';

function MainButton({
  onCreateRoom,
  onSoloPlay,
  onChallengePlay
}) {
  return (
    <div className="main-btn-box">
      <div className="btn-box">
        <button
          className="btn-secondary tooltip-btn"
          onClick={onSoloPlay}
          data-tooltip="코드를 따라적으며 랭킹을 갱신해요"
        >
          받아쓰기
        </button>
      </div>
      <div className="btn-box">
        <button
          className="btn-secondary tooltip-btn"
          onClick={onChallengePlay}
          data-tooltip="준비된 알고리즘 문제를 풀어봐요"
        >
          알고리즘
        </button>
      </div>
      <div className="btn-box">
        <button
          className="btn-primary tooltip-btn"
          onClick={onCreateRoom}
          data-tooltip="릴레이 게임 방을 생성해요"
        >
          방 만들기
        </button>
      </div>
    </div>
  );
}

export default MainButton;
