// src/utils/profanityFilter.js
import slangCsv from '../data/slang.csv?raw';
import leagueTxt from '../data/league-filter.txt?raw';

/* --------------------------------------------------------------
   1. Parse CSV – strip quotes *and* trailing commas
   -------------------------------------------------------------- */
function parseCsvBadWords(csvText) {
  const bad = new Set();
  csvText
    .trim()
    .split('\n')
    .forEach(line => {
      // "word",  or  word,
      let w = line.split(',').shift();           // first column
      w = w.replace(/^["']|["']$/g, '').trim(); // strip surrounding quotes
      if (w) bad.add(w.toLowerCase());
    });
  // console.log(`CSV → ${bad.size} words`);
  return bad;
}

/* --------------------------------------------------------------
   2. Parse TXT – just in case there are quotes
   -------------------------------------------------------------- */
function parseTxtBadWords(txtText) {
  const bad = new Set();
  txtText
    .trim()
    .split('\n')
    .forEach(line => {
      let w = line.trim().replace(/^["']|["']$/g, '');
      if (w) bad.add(w.toLowerCase());
    });
  // console.log(`TXT → ${bad.size} words`);
  return bad;
}

/* --------------------------------------------------------------
   3. Merge
   -------------------------------------------------------------- */
function mergeBadWordSets(sets) {
  const merged = new Set();
  sets.forEach(s => s.forEach(w => merged.add(w)));
  return merged;
}

/* --------------------------------------------------------------
   4. Core filter – now returns { cleaned, matches }
   -------------------------------------------------------------- */
function filterNickname(nickname, badWords) {
  if (!nickname || badWords.size === 0) return { cleaned: nickname, matches: [] };

  const lowerNick = nickname.toLowerCase();
  const matches   = new Set();          // <-- will hold groups + direct words
  let   filtered  = nickname;

  /* ---------- 1. GROUP CHECK (obfuscated) ---------- */
  const groups = {
    hangul:   (lowerNick.match(/[\uAC00-\uD7AF]/g)   || []).join(''),
    latin:    (lowerNick.match(/[a-z]/gi)          || []).join('').toLowerCase(),
    hiragana: (lowerNick.match(/[\u3040-\u309F]/g)  || []).join(''),
    katakana: (lowerNick.match(/[\u30A0-\u30FF]/g)  || []).join(''),
    kanji:    (lowerNick.match(/[\u4E00-\u9FFF]/g)  || []).join(''),
  };

  // If any group equals a bad word → block + record it
  for (const g of Object.values(groups)) {
    if (g && badWords.has(g)) {
      matches.add(g);
      // optional: replace the whole nickname with asterisks so cleaned ≠ trimmed
      filtered = '*'.repeat(nickname.length);
    }
  }

  /* ---------- 2. DIRECT KEYWORD CHECK ---------- */
  badWords.forEach(badWord => {
    const escaped = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(escaped, 'gi');

    if (regex.test(filtered)) {
      matches.add(badWord);
    }
    filtered = filtered.replace(regex, '*'.repeat(badWord.length));
  });

  const cleaned = /^\*+$/.test(filtered) ? '' : filtered;

  return { cleaned, matches: Array.from(matches) };
}

/* --------------------------------------------------------------
   5. Public init (sync)
   -------------------------------------------------------------- */
export function initProfanityFilter() {
  const csv = parseCsvBadWords(slangCsv);
  const txt = parseTxtBadWords(leagueTxt);
  const all = mergeBadWordSets([csv, txt]);
  // console.log(`TOTAL bad words: ${all.size}`);
  return nick => filterNickname(nick, all);
}