// ThemeProvider.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // 💡 페이지 로드 시 <html> 태그에도 바로 적용해줍니다.
    const initialTheme = savedTheme || 'light';
    document.documentElement.setAttribute('data-theme', initialTheme); 
    return initialTheme;
  });

  useEffect(() => {
    // 1. localStorage에 저장
    localStorage.setItem('theme', theme);
    
    // 2. 🚨 <html> 태그의 속성을 변경 (CSS가 이걸 보고 바뀜)
    document.documentElement.setAttribute('data-theme', theme);

  }, [theme]); // theme이 변경될 때마다 실행

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);