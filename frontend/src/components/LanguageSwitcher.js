import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी (Hindi)' },
        { code: 'mr', label: 'मराठी (Marathi)' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'te', label: 'తెలుగు (Telugu)' },
        { code: 'ta', label: 'தமிழ் (Tamil)' },
        { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
        { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
        { code: 'bn', label: 'বাংলা (Bengali)' }
    ];

    return (
        <div className="language-switcher-container">
            <div className="dropdown-wrapper">
                <span className="dropdown-icon">🌐</span>
                <select
                    className="lang-select"
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    aria-label="Select Language"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
                <span className="chevron-icon">▼</span>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
