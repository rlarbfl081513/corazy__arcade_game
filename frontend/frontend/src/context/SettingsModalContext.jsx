import { createContext, useContext, useState } from 'react';

const SettingsModalContext = createContext();

export const useModalTempSettings = () => useContext(SettingsModalContext);

export function SettingsModalProvider({ children }) {
  // State to hold the temporary settings object while the modal is open
  const [tempSettingsOverride, setTempSettingsOverride] = useState(null); 
  
  // tempSettingsOverride will be an object when the modal is open, and null when closed.

  const value = {
    tempSettingsOverride,
    setTempSettingsOverride,
  };

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
    </SettingsModalContext.Provider>
  );
}