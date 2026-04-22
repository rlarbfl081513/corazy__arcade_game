import { useState } from 'react';
import SettingsModal from '@/components/SettingsModal';
import SettingsIcon from '@/assets/icon/settings.png';
import './SettingsButton.css';

export default function SettingsButton({ gameMode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="settings-btn" onClick={() => setOpen(true)}>
        <img src={SettingsIcon} alt="Settings" className="settings-icon" />
      </button>

      {open && (
        <SettingsModal
          gameMode={gameMode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}