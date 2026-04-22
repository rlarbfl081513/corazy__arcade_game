import React, { useState, useEffect } from 'react';
import { getGameResult } from '@/api/relayApi';

/**
 * 게임 종료 후 기여도 분석 결과를 보여주는 모달 컴포넌트
 * @param {boolean} isOpen - 모달의 열림/닫힘 상태
 * @param {function} onClose - 모달을 닫는 함수
 * @param {string} roomId - 현재 게임 방 ID
 */
const EnhancedResultModal = ({ isOpen, onClose, roomId }) => {
  console.log('🔍 [EnhancedResultModal] Render - isOpen:', isOpen, 'roomId:', roomId);
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && roomId) {
      const fetchResult = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await getGameResult(roomId);
          if (response.success) {
            setResultData(response.data);
          } else {
            throw new Error(response.message || '결과를 불러오는 데 실패했습니다.');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchResult();
    }
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const contributionData = resultData?.contributionData;
  const rankings = resultData?.participants;

  const AwardCard = ({ title, awardData }) => (
    <div className="award-card">
      <h3 className="award-title">{title}</h3>
      <p className="award-nickname">{awardData?.nickname ?? 'N/A'}</p>
      {title !== "최고 기여자" && (
        <p className="award-value">
          {awardData?.value ?? 0} {awardData?.unit ?? ''}
        </p>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <div className="result-modal-loading">결과를 집계하는 중입니다...</div>;
    }
    if (error) {
      return <div className="result-modal-error">오류: {error}</div>;
    }
    if (!resultData) {
      return <div className="result-modal-no-data">결과 데이터가 없습니다.</div>;
    }

    return (
      <>
        <div className="result-awards-grid">
          <AwardCard title="최고 기여자" awardData={contributionData?.bestCoder} />
          <AwardCard title="타자왕" awardData={contributionData?.fastestTyper} />
          <AwardCard title="멍때리기 장인" awardData={contributionData?.idleMaster} />
        </div>
        <div className="result-rankings">
          <h3 className="rankings-title">최종 순위</h3>
          {rankings && rankings.length > 0 ? (
            <table className="rankings-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>유저</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((p, index) => (
                  <tr key={p.userId}>
                    <td className="rank-cell">{index + 1}</td>
                    <td>{p.nickname}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rankings-no-data">순위 정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </>
    );
  };

  console.log('🔍 [EnhancedResultModal] 모달 렌더링 중! DOM에 추가됨');

  return (
    <div className="result-modal-overlay">
      <div className="result-modal-content">
        <h2 className="result-modal-title">게임 결과</h2>
        {renderContent()}
        <div className="result-modal-footer">
          <button onClick={onClose} className="result-modal-close-btn">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedResultModal;
