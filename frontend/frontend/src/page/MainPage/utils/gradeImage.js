import grade1 from '@/page/MainPage/assets/grade1.png';
import grade2 from '@/page/MainPage/assets/grade2.png';
import grade3 from '@/page/MainPage/assets/grade3.png';
import grade4 from '@/page/MainPage/assets/grade4.png';
import grade5 from '@/page/MainPage/assets/grade5.png';

/**
 * 점수에 따라 등급 이미지를 반환하는 함수
 * @param {number} score - 점수 (CPM 또는 SCORE)
 * @returns {string} - 등급 이미지 경로
 *
 * 등급 기준:
 * - 100 미만: grade1.png
 * - 100 이상 200 미만: grade2.png
 * - 200 이상 300 미만: grade3.png
 * - 300 이상 400 이하: grade4.png
 * - 400 초과: grade5.png
 */
export const getGradeImage = (score) => {
  const numScore = Number(score) || 0;

  if (numScore < 100) {
    return grade1;
  } else if (numScore < 200) {
    return grade2;
  } else if (numScore < 300) {
    return grade3;
  } else if (numScore <= 400) {
    return grade4;
  } else {
    return grade5;
  }
};
