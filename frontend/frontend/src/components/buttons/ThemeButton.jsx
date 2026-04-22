

import React from "react";
import { useTheme } from '@/components/ThemeProvider';
import lightModeIcon from '@/assets/icon/lightMode.png'
import darkModeIcon from '@/assets/icon/darkMode.png'


function ThemeButton () {

    const { theme, toggleTheme } = useTheme();

    return (
        <>
        <button onClick={toggleTheme} className="btn theme-toggle-button">
            {theme === 'dark' ? (
                <>
                    <img src={lightModeIcon} className='btn-icon'/>
                    <div className="icon-name">Light</div>
                </>

            ) : (
                <>
                    <img src={darkModeIcon} className='btn-icon'/>
                    <div className="icon-name">Dark</div>
                </>
            ) }
        </button>
        </>
    );
}

export default ThemeButton;