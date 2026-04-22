import { useRef, useEffect } from 'react';
import './LeftSidebar.responsive.css';
import { getGradeImage } from '@/page/MainPage/utils/gradeImage';

/**
 * 왼쪽 사이드바 컴포넌트
 * - 서비스 로고
 * - 내 랭킹 정보
 * - 유저 순위 목록 (무한 스크롤)
 */
function LeftSidebar({ myRanking, userRankings, onLoadMore, hasMore, isLoading }) {
  const observerTarget = useRef(null);

  // Intersection Observer를 사용한 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 타겟이 화면에 보이고, 더 불러올 데이터가 있고, 로딩 중이 아닐 때
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1, // 10%만 보여도 트리거
        rootMargin: '50px', // 50px 전에 미리 로드
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div className="left-sidebar">
      {/* 내 정보 영역 */}
      <div className="my-ranking-section">
        <div className="my-ranking-card">
          <div className="my-image">
              <img src={getGradeImage(myRanking?.score)} alt="User Profile" className="rank-my-image" />
          </div>
          <div className="player-info text">
              <div className="player-rank small">{myRanking?.rank || '-'} 위</div>
              <div className="side-info">
                {myRanking?.name || '플레이어'}
                <div className="player-score big">{myRanking?.score || 0} cpm</div>
              </div>
          </div>
        </div>
        <div className="back-box box1"></div>
        <div className="back-box box2"></div>
      </div>

      {/* 유저 순위 목록 */}
      <div className="rankings-section">
        <div className="rank-title">
          <div className="rank-sub-title"></div>
          RANKING
          <div className="rank-sub-title">(cpm)</div>
        </div>

        <div className="rankings-list">
          {userRankings.map((user, index) => (
            <div key={`${user.userId}-${user.rank}-${index}`} className="ranking-item">
              <div className="rank-left">
                <span className="rank">{user.rank}</span>
                <span className="rank-user-img">
                  <img src={getGradeImage(user.score)} alt="User Profile" className="rank-user-image" />
                </span>
                <div title={user.name} className="name">{user.name}</div>
              </div>
              <span className="score">{user.score}</span>
            </div>
          ))}

          {/* 무한 스크롤 트리거 요소 */}
          {hasMore && (
            <div ref={observerTarget} className="loading-trigger">
              {isLoading && (
                <div className="loading-indicator">
                  <span>Loading...</span>
                </div>
              )}
            </div>
          )}

          {/* 더 이상 데이터 없을 때 */}
          {!hasMore && userRankings.length > 0 && (
            <div className="no-more-data">
              <span>모든 랭킹을 불러왔습니다</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;
