import { useEffect, useState } from 'react';
import './ProblemGameStartModal.css';
import OptionButtons from '@/components/buttons/OptionButtons';
import { getAlgorithms } from '@/api/problemApi';
import { getLanguages } from '@/api/problemApi';

/**
 * 혼자놀기 게임 설정 모달 컴포넌트
 * - 언어 선택 드롭다운
 * - 알고리즘 선택 드롭다운
 * - 취소/완료 버튼
 */

function ProblemGameStartModal({ isOpen, onClose, onConfirm, confirmText }) {
  // api 응답을 저장할 state 추가
  const [languageOptions, setLanguageOptions] = useState([]);
  const [algorithmOptions, setAlgorithmOptions] = useState([]);

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [isAlgoOpen, setIsAlgoOpen] = useState(false); // 드롭다운 리스트에서 선택된 것만 다른 색상으로 나타내기 위해 추가한 코드

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
          const algoData = await getAlgorithms();
          // console.log("langData:",langData);
          // console.log("algoData:",algoData);
          
          // {id, name} 형태로 변화
          const formattedLanguages = langData.map(lang => ({
            id : lang.id,
            name : lang.language
          }));
          const formattedAlgorithms = algoData.map(algo => ({
            id : algo.id,
            name : algo.name
          }));

          // 변환된 데이터를 state에 저장
          setLanguageOptions(formattedLanguages);
          setAlgorithmOptions(formattedAlgorithms);

          // 데이터 로드 후 첫 번째 항목을 기본값으로 설정
          if (formattedLanguages.length > 0) {
            setSelectedLanguage(formattedLanguages[0].name);
          }
          if (formattedAlgorithms.length > 0) {
            setSelectedAlgorithm(formattedAlgorithms[0].name);
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

  // 모달 닫기 및 초기화
  const handleClose = () => {
    // setSelectedLanguage('');
    // setSelectedAlgorithm('');
    onClose();
  };

  // 게임 시작
  const handleStart = () => {
    
    if (!selectedLanguage || !selectedAlgorithm) {
      alert('언어와 알고리즘을 모두 선택해주세요!');
      return;
    }

    const langObj = languageOptions.find(lang => lang.name === selectedLanguage);
    const algoObj = algorithmOptions.find(lang => lang.name === selectedAlgorithm);

    onConfirm({
      selectedLanguageId : langObj.id,
      selectedLanguageName : langObj.name,
      selectedAlgorithmId : algoObj.id,
      selectedAlgorithmName : algoObj.name
    });
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="header-box">
          <div className="icon-box"></div>
          <h2>알고리즘</h2>
          <div className="icon-box">
            <button className="modal-btn-cancel-icon" onClick={handleClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
            
          </div>
        </div>
        
        <div className="option-box">
            {/* 언어 선택 버튼 */}
            <div className="modal-field">
              <label>LAN</label>
              <OptionButtons
                options={languageOptions}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
              />
            </div>

            {/* 알고리즘 선택 드롭다운 */}
            <div className="modal-field">
              <label htmlFor="algorithm-select">ALGO</label>
              <select
                placement="bottom"
                id="algorithm-select"
                value={selectedAlgorithm}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value);
                  // ↓ 선택 직후 바로 닫히도록 (브라우저별 타이밍 이슈 대비)
                  requestAnimationFrame(() => {
                    setIsAlgoOpen(false);
                    e.target.blur();
                  });
                }}
                // 드롭다운에서 선택된 것만 색상이 들어가게 하기위해 추가한 코드
                  // 브라우저의 기본 렌더링으로 인해 선택된 알고리즘만 색상을 바꾸는데 안돼서
                  // 드롭다운의 열림닫힘을 나누는 방식으로 색상 입힘
                onFocus={() => setIsAlgoOpen(true)}
                onBlur={() => setIsAlgoOpen(false)}
                className={`modal-select ${
                    selectedAlgorithm ? "is-selected" : ""
                  } ${isAlgoOpen ? "is-open" : ""}`}
              >
                {/* <option value="">알고리즘을 선택하세요</option> */}
                {algorithmOptions.map((algo) => (
                  <option 
                      key={algo.id} 
                      value={algo.name}>
                    {algo.name}
                  </option>
                ))}
              </select>
            </div>
        </div>     

        {/* 버튼 영역 */}
        <div className="modal-buttons">
          <button className="modal-btn-confirm" onClick={handleStart}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProblemGameStartModal;
