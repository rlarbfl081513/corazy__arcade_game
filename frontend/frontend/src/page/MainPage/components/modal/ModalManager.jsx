import { useEffect, useState } from 'react';
import CreateRoomModal from '@/page/MainPage/components/modal/CreateRelayRoomModal';
import ProblemListModal from '@/page/MainPage/components/modal/ProblemListModal';
import { getProblemList,getProblemInfo } from '@/api/problemApi';
import ProblemGameStartModal from '@/page/MainPage/components/modal/ProblemGameStartModal';
import DictationGameStartModal from '@/page/MainPage/components/modal/DictationGameStartModal';
import CreateRelayRoomModal from '@/page/MainPage/components/modal/CreateRelayRoomModal';
import CreateBattleRoomModal from '@/page/MainPage/components/modal/CreateBattleRoomModal';
import ModeSelectModal from './ModeSelectModal';

const LANG_TO_MONACO = {
  'Java': 'java',
  'Python': 'python',
  'C++': 'cpp',
  'Javascript': 'javascript'
};

function ModalManager({ modalType, onClose, onStartDictation, onStartChallenge, onCreateRoom }) {

  // 언어와 알고리즘 선택 후 목록 모달을 띄우기 위한것 
  const [challengeStep, setChallengeStep] = useState('select'); // select & list
  
  // 모드 선택에 따른 모달창
  const [roomMode, setRoomMode] = useState('relay');
  // 선택한 언어와 알고리즘 기억하기
  const [challengeSettings, setChallengeSettings] = useState(null);
  // 문제 상세정보 부르기
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  ////  문제 풀이 api
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

    // 필터 상태
  const [algorithmIds, setAlgorithmIds] = useState([]);
  const [languageIds, setLanguageIds] = useState([]);
  const [titlePrefix, setTitlePrefix] = useState('');

    // 페이징 상태
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

    // useEffect를 사용해서 리스트로 변할떄 api가 호출되게하여 빈목록이 뜨지 않도록함
  useEffect(() => {
    if (modalType ==='challenge' && challengeStep === 'list') {
      const fetchProblems = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const {selectedLanguageId, selectedAlgorithmId} = challengeSettings;
          const data = await getProblemList({
            languageIds: [selectedLanguageId],
            algorithmIds: [selectedAlgorithmId],
            page: page,
            limit: limit
          });

          console.log(data)
          setProblems(data.items || []);
          setTotal(data.total || 0);

        } catch (error) {
          console.log("문제 목록 조회 실패 : ", error);
          alert('문제목록을 불러온데 실패했습니다.');
          resetStateAndClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchProblems();
    }
  }, [modalType, challengeStep, challengeSettings, page, limit])

  // 릴레이 모드 -> 게임 설정 모달 
  const handleShowRelayModal = () => {
    setRoomMode('relay');
    console.log('릴레이 모드 모달 열림')
  }
   // 배틀 모드 -> 게임 설정 모달 
  const handleShowBattleModal = () => {
    setRoomMode('battle');
    console.log('개인전 모드 모달 열림')
  }


  // 챌린지 : 언어와 알고리즘 종류 선택
  // 1단계: 설정 -> 목록
  const handleShowProblemList = (settings) => { // GameStartModal로부터 { selectedLanguage, ... } 받음
    try {
      console.log('1단계 (설정 완료):', settings);

      setChallengeSettings(settings); // 'setChallengSettings' -> 'setChallengeSettings'
      setChallengeStep('list');     // 'setChallengStep' -> 'setChallengeStep'
      
    } catch (error) {
      console.error('챌린지 1단계 실패:', error);
      alert('설정을 저장하는 데 실패했습니다.');
    }
  }

  // 2단계: 목록 -> 게임 시작
  const handleProblemSelectAndStart = (prob) => {
    // API 호출(getProblemInfo) 삭제!
    
    console.log('2단계 (문제 선택):', prob.problem_number);
    
    // 부모(MainPage)에게 "이 문제 번호로 이동시켜줘"라고 ID만 전달
    const selectedLang = challengeSettings?.selectedLanguageName || 'Javascript';
    onStartChallenge(prob.problem_number, selectedLang);
    
    resetStateAndClose();
  };


  // --- 3. 페이지네이션 핸들러 함수 ---
  const handleNextPage = () => {
    // 다음 페이지가 있는지 확인
    if ((page + 1) * limit < total) {
      setPage(p => p + 1); // page state를 변경 -> useEffect가 재실행됨
    }
  };

  const handlePrevPage = () => {
    // 이전 페이지가 있는지 확인
    if (page > 0) {
      setPage(p => p - 1); // page state를 변경 -> useEffect가 재실행됨
    }
  };

  const resetStateAndClose = () => {
    setChallengeStep('select');
    setChallengeSettings(null);
    setProblems([]);
    setTotal(0);
    setPage(0);
    setIsLoading(false);
    setError(null);
    onClose();
  };

  const resetModeAndClose = () => {
    setRoomMode('relay');
    onClose();
  };

  // 받아쓰기 시작 핸들러 (MainPage에서 이동)
  const handleDictationStart = (settings) => {
    // API 호출(getDictationByLangAlgo) 삭제!
    
    const langId = settings.selectedLanguageId;
    const algoId = settings.selectedAlgorithmId;

    console.log('받아쓰기 설정 선택:', { langId, algoId });

    // 부모(MainPage)에게 "이 설정으로 이동시켜줘"라고 전달
    // monacoLanguage 변환 로직도 페이지 가서 해도 됨, 혹은 여기서 문자열만 넘김
    onStartDictation(langId, algoId); 
    
    onClose();
  };


  // modalType에 따라 적절한 모달을 렌더링
  switch (modalType) {
    case 'challenge':
      if (challengeStep === 'list') {
        return (
          <ProblemListModal
            isOpen={true}
            onClose={resetStateAndClose}
            onSelectProblem={handleProblemSelectAndStart} // 2. 문제 선택 시 이 함수를 호출해!
            algorithm={challengeSettings.selectedAlgorithm} // 3. 모달 제목은 이거야!
            
            // 데이터를 props로 전달
            problems={problems}
            total={total}
            isLoading={isLoading}
            error={error}

            //페이지 네이션 props로 전달
            page={page}
            limit={limit}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        )
      }

      return (
        <ProblemGameStartModal
          isOpen={true}
          onClose={resetStateAndClose}
          onConfirm={handleShowProblemList}
          confirmText="문제 목록 보기"
        />
      );

    case 'dictation':
      return (
        <DictationGameStartModal
          isOpen={true}
          onClose={onClose}
          onConfirm={handleDictationStart}
          confirmText="게임 시작"
        />
      );

    case 'createRoom':
      if (roomMode === 'relay') {
        return (
            <CreateRelayRoomModal
              isOpen={true}
              onClose={resetModeAndClose}
              onConfirm={onCreateRoom}
            />
          );
      } else if (roomMode === 'battle') {
        // 알고리즘 개인전 모달
        return (
          <CreateBattleRoomModal
            onClose={resetModeAndClose}
          />
        );
      } 
      return (
        <ModeSelectModal
          onClose={resetModeAndClose}
          onRelay={handleShowRelayModal}
          onBattle={handleShowBattleModal}
        />
      );
      

    default:
      return null; // 아무 모달도 열려있지 않음
  }
}


export default ModalManager;
