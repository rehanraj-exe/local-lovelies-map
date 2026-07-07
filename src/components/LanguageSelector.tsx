import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
];

export const LanguageSelector = () => {
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Check if script already exists to prevent duplicates
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: LANGUAGES.map(l => l.code).join(','),
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
    }

    // Try to determine current language from cookie
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    
    // Find the hidden Google Translate select and trigger change
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // Fallback if widget hasn't fully loaded but script exists: Set cookie and reload
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.hostname}; path=/`;
      window.location.reload();
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative inline-flex items-center z-50">
      {/* Hidden Google Widget Container */}
      <div id="google_translate_element" className="hidden"></div>
      
      {/* Our Beautiful Custom Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium shadow-sm"
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline-block">{selectedLang.native}</span>
            <span className="sm:hidden">{selectedLang.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto rounded-xl shadow-xl border-purple-100">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem 
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex justify-between items-center px-4 py-2 cursor-pointer ${currentLang === lang.code ? 'bg-purple-50 text-purple-700 font-semibold' : ''}`}
            >
              <span>{lang.native}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <style>{`
        /* Aggressively hide all Google Translate UI components */
        .skiptranslate iframe,
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        /* Hide the google branding */
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
