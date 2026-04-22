import { useState, useEffect } from 'react';
import useGameSettings from '@/hooks/useGameSettings';
import { useModalTempSettings } from '@/context/SettingsModalContext';
import './SettingsModal.css';

import { DEFAULT_BGM_BY_MODE } from '@/config/bgm'; 
const cursorGifUrl = "/path/to/your/custom_cursor_preview.gif"; 
const KOREAN_MODE_LABELS = {
  global: '게임',
  dictation: '받아쓰기',
  challenge: '알고리즘',
  relay: '릴레이',
};

// --- NEW/UPDATED GLOBAL CONSTANTS ---

const descriptionCustomCursor = "CORAZY ARCADE 테마 커서를 사용합니다.";
const descriptionPowermodeParticles = "코드를 입력하면 파편이 튑니다.";
const descriptionPowermodeShake = "코드를 입력하면 에디터가 흔들립니다.";

const descriptionPowermodeCombo = "연속된 정확한 입력에 대한 영구적인 카운터를 표시합니다.";
const descriptionPowermodeVolcano = "최고의 성능 중에 폭발적인 시각 효과를 활성화합니다.";

// ⭐ 1. BGM OPTIONS
// Add your actual BGM track paths here.
// The 'value' is what will be saved in the settings.
const BGM_OPTIONS = [
  { label: '☕️ 8-Bit Hip Hop', value: '/bgm/thebirdbrand - 8-Bit Hip Hop.mp3' },
  { label: '[R] ☕️ 8-Bit Hip Hop', value: '/bgm/(old-school) thebirdbrand - 8-Bit Hip Hop.mp3' },
  { label: '⚡️ Chiptune Dubstep Fusion Instrumental', value: '/bgm/nickpanek - Chiptune Dubstep Fusion Instrumental.mp3' },
  { label: '[R] ⚡️ Chiptune Dubstep Fusion Instrumental', value: '/bgm/(old-school) nickpanek - Chiptune Dubstep Fusion Instrumental.mp3' },
  { label: '🎮 Chiptune Ending', value: '/bgm/nickpanek - Chiptune Ending.mp3' },
  { label: '[R] 🎮 Chiptune Ending', value: '/bgm/(old-school) nickpanek - Chiptune Ending.mp3' },
  { label: '🎬 Chiptune Sherlock Holmes Anthem', value: '/bgm/nickpanek - Chiptune Sherlock Holmes Anthem.mp3' },
  { label: '[R] 🎬 Chiptune Sherlock Holmes Anthem', value: '/bgm/(old-school) nickpanek - Chiptune Sherlock Holmes Anthem.mp3' },
  { label: '🏆 Entropy', value: '/bgm/Distrion, Alex Skrindo - Entropy.mp3' },
  { label: '[R] 🏆 Entropy', value: '/bgm/(old-school) Distrion, Alex Skrindo - Entropy.mp3' },
  { label: '👾 Level VI', value: '/bgm/moodmode - Level VI.mp3' },
  { label: '[R] 👾 Level VI', value: '/bgm/(old-school) moodmode - Level VI.mp3' },
  { label: '🏝 Overworld Melody', value: '/bgm/AyItsMatt - Overworld Melody.mp3' },
  { label: '[R] 🏝 Overworld Melody', value: '/bgm/(old-school) AyItsMatt - Overworld Melody.mp3' },
  { label: '🌠 Pixel Rush', value: '/bgm/MrOneILoveALot - Pixel Rush.mp3' },
  { label: '[R] 🌠 Pixel Rush', value: '/bgm/(old-school) MrOneILoveALot - Pixel Rush.mp3' },
  { label: '👩‍❤️‍👨 Relay!', value: '/bgm/RelayGame.mp3' },
  { label: '[R] 👩‍❤️‍👨 Relay!', value: '/bgm/(old-school) RelayGame.mp3' },
  
  { label: '(BGM OFF)', value: 'none' },
];
// ------------------------------------

export default function SettingsModal({ gameMode, onClose }) {
  // Get allSettings and the new saveAllSettings function
  const { allSettings, saveAllSettings } = useGameSettings();
  const { setTempSettingsOverride } = useModalTempSettings();

  const [tempSettings, setTempSettings] = useState(JSON.parse(JSON.stringify(allSettings)));

  useEffect(() => {
    setTempSettingsOverride(tempSettings);
    return () => setTempSettingsOverride(null); // Cleanup
  }, []);
  
  const [activeTab, setActiveTab] = useState('global');

  const updateTempSettingsAndOverride = (newTemp) => {
    setTempSettings(newTemp);
    setTempSettingsOverride(newTemp);
  }

  // Build tabs - 한국어 라벨 적용
  const TABS = [
    { key: 'global', label: KOREAN_MODE_LABELS.global }
  ];

  if (gameMode) {
    TABS.push({
      key: gameMode,
      label: KOREAN_MODE_LABELS[gameMode] || capitalize(gameMode)
    });
  } else {
    Object.keys(tempSettings).forEach(modeKey => {
      if (modeKey !== 'global' && KOREAN_MODE_LABELS[modeKey]) {
        TABS.push({
          key: modeKey,
          label: KOREAN_MODE_LABELS[modeKey]
        });
      }
    });
  }

  // updateTempGlobal
  const updateTempGlobal = (key, value) => {
    const newTemp = {
      ...tempSettings,
      global: { ...tempSettings.global, [key]: value },
    };
    updateTempSettingsAndOverride(newTemp);
  };

  // updateTempMode
  const updateTempMode = (mode, key, value) => {
    const newTemp = {
      ...tempSettings,
      [mode]: { ...tempSettings[mode], [key]: value },
    };
    updateTempSettingsAndOverride(newTemp);
  };

  const handleSave = () => {
    saveAllSettings(tempSettings);
    setTempSettingsOverride(null);
    onClose();
  };

  const handleClose = () => {
    setTempSettingsOverride(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="header-box">
          <div className="icon-box"></div>
          <h2>환경설정</h2>
          <div className="icon-box">
            <button className="modal-btn-cancel-icon" onClick={handleClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          
          </div>
        </div>

        <div className="modal-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'global' && <GlobalTab settings={tempSettings.global} update={updateTempGlobal} />}
          {activeTab !== 'global' && (
            <ModeTab
              mode={activeTab}
              settings={tempSettings[activeTab] || {}}
              update={updateTempMode}
            />
          )}
        </div>

        <div className="modal-buttons">
          {/* This button now correctly saves only when clicked */}
          <button className="modal-btn-confirm" onClick={handleSave}>적용</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Global Tab (No Changes) ---------- */
function GlobalTab({ settings, update }) {
  return (
    <section className="tab-section">
      <h3 className="setting-section-header">사운드</h3>

      {/* BGM setting group */}
      <div className="setting-group">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.bgm}
            onChange={e => update('bgm', e.target.checked)}
          />
          <span className="slider" /> BGM
        </label>
      </div>

      <label className="range">
        
        <input
          type="range"
          min="0"
          max="100"
          value={settings.bgmVolume}
          onChange={e => update('bgmVolume', Number(e.target.value))}
        />
        <span>{settings.bgmVolume}%</span>
      </label>

      {/* SFX setting group */}
      <div className="setting-group">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.sfx}
            onChange={e => update('sfx', e.target.checked)}
          />
          <span className="slider" /> 효과음
        </label>
      </div>

      <label className="range">
        
        <input
          type="range"
          min="0"
          max="100"
          value={settings.sfxVolume}
          onChange={e => update('sfxVolume', Number(e.target.value))}
        />
        <span>{settings.sfxVolume}%</span>
      </label>

      <h3 className="setting-section-header">화면</h3>
      {/* Custom Cursor setting group with GIF and description */}
      <div className="setting-group">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.cursor}
            onChange={e => update('cursor', e.target.checked)}
          />
          <span className="slider" /> 커서 테마
        </label>
        <img 
            src={cursorGifUrl} 
            alt="" 
            className="setting-preview-gif"
            style={{ display: settings.cursor ? 'block' : 'none' }} // Show GIF only if active
        />
        <p className="setting-desc">{descriptionCustomCursor}</p>
      </div>
    </section>
  );
}

/* ---------- Mode-specific Tab (UPDATED: Added BGM Dropdown) ---------- */
function ModeTab({ mode, settings, update }) {
  // ADDED COMBO and VOLCANO (for dictation mode) and updated descriptions
  const controls = {
    dictation: [
      { key: 'particles', label: '파티클', description: descriptionPowermodeParticles },
      { key: 'shake',       label: '셰이크', description: descriptionPowermodeShake },
      // { key: 'combo',       label: 'Combo Meter', description: descriptionPowermodeCombo },
      // { key: 'volcano',    label: 'Volcano Mode', description: descriptionPowermodeVolcano },
    ],
    challenge: [
      { key: 'particles', label: '파티클', description:  descriptionPowermodeParticles },
      { key: 'shake',       label: '셰이크', description: descriptionPowermodeShake },
      // { key: 'combo',       label: 'Combo Meter', description: descriptionPowermodeCombo },
    ],
    relay: [
      { key: 'particles', label: '파티클', description:  descriptionPowermodeParticles },
      { key: 'shake',       label: '셰이크', description: descriptionPowermodeShake },
      // { key: 'combo',       label: 'Combo Meter', description: descriptionPowermodeCombo },
    ],
  }[mode] || [];

  const [isBgmDropdownOpen, setIsBgmDropdownOpen] = useState(false);

  // Group ALL power-related controls (particles, shake, combo, volcano)
  const powerModeControls = controls.filter(c => ['particles', 'shake', 'combo', 'volcano'].includes(c.key));
  const otherControls = controls.filter(c => !['particles', 'shake', 'combo', 'volcano'].includes(c.key));
  const currentBGMValue = (settings.selectedBGM && settings.selectedBGM !== 'default')
    ? settings.selectedBGM 
    : DEFAULT_BGM_BY_MODE[mode];
  return (
    <section className="tab-section">
      <div className="modal-field">
        <label>BGM</label>
        <select
          value={currentBGMValue}
          onChange={(e) => {
            update(mode, 'selectedBGM', e.target.value);
            // 선택 후 바로 닫히고 포커스 해제 (브라우저 호환성 보장)
            requestAnimationFrame(() => {
              setIsBgmDropdownOpen(false);
              e.target.blur();
            });
          }}
          onFocus={() => setIsBgmDropdownOpen(true)}
          onBlur={() => setIsBgmDropdownOpen(false)}
          className={`modal-select ${
            currentBGMValue && currentBGMValue !== 'none' ? 'is-selected' : ''
          } ${isBgmDropdownOpen ? 'is-open' : ''}`}
        >
          {BGM_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="setting-desc" style={{ marginTop: '8px' }}>
        [R]: 아날로그 TV 시절 비디오 게임 감성을 느껴보세요.
      </p>

      {/* --- Power Mode Section --- */}
      {powerModeControls.length > 0 && (
        <>
          {/* ⭐ 3. Changed from h2 to h3 for better semantic hierarchy */}
          <h3 className="setting-section-header">POWER MODE ! ! ! ! !</h3>
          {powerModeControls.map(c => (
            <div key={c.key} className="setting-group">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings[c.key]}
                  onChange={e => update(mode, c.key, e.target.checked)}
                />
                <span className="slider" /> {c.label}
              </label>
              {c.description && <p className="setting-desc">{c.description}</p>}
            </div>
          ))}
        </>
      )}
      {otherControls.map(c => (
        <div key={c.key} className="setting-group">
          <label key={c.key} className="switch">
            <input
              type="checkbox"
              checked={settings[c.key]}
              onChange={e => update(mode, c.key, e.target.checked)}
            />
            <span className="slider" /> {c.label}
          </label>
          {c.description && <p className="setting-desc">{c.description}</p>}
        </div>
      ))}
    </section>
  );
}

/* ---------- Helper: capitalize (No Changes) ---------- */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}