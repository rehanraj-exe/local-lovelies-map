import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export const LanguageSelector = () => {
  useEffect(() => {
    // Prevent multiple initializations
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            // Include major Indian languages + English
            includedLanguages: 'hi,te,ta,mr,bn,gu,kn,ml,pa,or,en',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    const addScript = document.createElement('script');
    addScript.id = 'google-translate-script';
    addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    addScript.async = true;
    document.body.appendChild(addScript);

    return () => {
      // Optional cleanup if needed
    };
  }, []);

  return (
    <div className="relative inline-flex items-center z-50">
      <div id="google_translate_element" className="translate-widget"></div>
      <style>{`
        /* Hide the annoying top banner that Google Translate sometimes adds */
        .skiptranslate iframe {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        /* Style the select dropdown */
        .goog-te-combo {
          padding: 8px 12px;
          border-radius: 9999px; /* full rounded like buttons */
          border: 1px solid #e2e8f0;
          background-color: white;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #475569;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .goog-te-combo:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .goog-te-combo:focus {
          border-color: #8b5cf6;
          ring: 2px;
        }
        /* Hide the Google logo */
        .goog-logo-link {
          display: none !important;
        }
        .goog-te-gadget {
          color: transparent !important;
          font-size: 0px;
        }
      `}</style>
    </div>
  );
};
