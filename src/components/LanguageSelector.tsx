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
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[60] bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-glow border border-purple-100 animate-fade-in hover:scale-105 transition-all">
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
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          outline: none;
          font-family: inherit;
          color: #475569;
          cursor: pointer;
          font-weight: 500;
        }
        .goog-te-combo:focus {
          border-color: #8b5cf6;
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
