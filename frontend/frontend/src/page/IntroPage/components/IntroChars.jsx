import { useMemo } from 'react';
import './IntroChars.css';

import logoImg from '@/page/IntroPage/assets/logo.png';

import dinoImg from '@/page/IntroPage/assets/chars/dino.png';
import eggImg from '@/page/IntroPage/assets/chars/egg.png';
import babyImg from '@/page/IntroPage/assets/chars/baby.png';
import youthImg from '@/page/IntroPage/assets/chars/youth.png';
import adultImg from '@/page/IntroPage/assets/chars/adult.png';

import cppImg from '@/page/IntroPage/assets/langs/cpp.png';
import javaImg from '@/page/IntroPage/assets/langs/java.png';
import javascriptImg from '@/page/IntroPage/assets/langs/javascript.png';
import pythonImg from '@/page/IntroPage/assets/langs/python.png';

/* ------------------------------------------------------------------ */
/* Data */
/* ------------------------------------------------------------------ */
const OTHER_CHARS = [
  { id: 'egg', src: eggImg },
  { id: 'baby', src: babyImg },
  { id: 'youth', src: youthImg },
  { id: 'adult', src: adultImg },
];

const LANGS = [
  { id: 'cpp', src: cppImg },
  { id: 'java', src: javaImg },
  { id: 'javascript', src: javascriptImg },
  { id: 'python', src: pythonImg },
];

/* ------------------------------------------------------------------ */
/* Fisher-Yates shuffle (returns a new array) */
/* ------------------------------------------------------------------ */
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
function IntroChars({ logoRef }) {
  const { group1, group2, soloChar } = useMemo(() => {
    // 1. Pick TWO random characters from OTHER_CHARS
    const shuffledChars = shuffle(OTHER_CHARS);
    const [charForGroup2, charForSolo] = shuffledChars; // first → group2, second → solo

    // 2. Pick TWO random languages
    const [lang1, lang2] = shuffle(LANGS).slice(0, 2);

    // 3. Build groups (ORDER FIXED)
    const group1 = {
      char: { id: 'dino', src: dinoImg },
      lang: lang1,
    };
    const group2 = {
      char: charForGroup2,
      lang: lang2,
    };

    const soloChar = charForSolo;

    return { group1, group2, soloChar };
  }, []);

  return (
    <>
      <div className="intro-logo" ref={logoRef}>
        <img src={logoImg} alt="CORAZY ARCADE" />
      </div>
      <div className="intro-chars-wrapper">
        {/* ---------- GROUP 1: ALWAYS DINO (fixed) ---------- */}
        <div key="dino-group" className="char-lang-group group-1">
          <img
            src={group1.char.src}
            alt={group1.char.id}
            className="char-img dino-char-inside"
          />
          <img
            src={group1.lang.src}
            alt={group1.lang.id}
            className="lang-img"
          />
        </div>

        {/* ---------- GROUP 2: RANDOM OTHER CHAR ---------- */}
        <div key="other-group" className="char-lang-group group-2">
          <img
            src={group2.char.src}
            alt={group2.char.id}
            className="char-img"
          />
          <img
            src={group2.lang.src}
            alt={group2.lang.id}
            className="lang-img"
          />
        </div>

        {/* ---------- SOLO: THE REMAINING CHARACTER ---------- */}
        <img
          src={soloChar.src}
          alt={soloChar.id}
          className="solo-char"
        />
      </div>
    </>
  );
}

export default IntroChars;