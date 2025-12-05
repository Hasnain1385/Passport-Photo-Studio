
import React from 'react';
import { AppSettings, ThemeMode } from '../types';
import { X, Key, ExternalLink, CheckCircle2, Monitor, Moon, Sun, Youtube, User, Phone, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  currentTheme,
  onThemeChange
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* About Developer Section */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">About Developer</h3>
             <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Developer</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Mirza Hasnain Baig</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                     <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</p>
                        <a href="tel:+923304524169" className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 transition">
                            +92-330-4524169
                        </a>
                    </div>
                </div>

                <a 
                    href="https://www.youtube.com/channel/UCFLQuLM-EcOm7r8ZtvITfKA?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FF0000] hover:bg-[#D90000] text-white rounded-lg transition shadow-md hover:shadow-lg mt-2 group"
                >
                    <Youtube className="w-5 h-5 fill-current" />
                    <span className="font-bold text-sm">Subscribe on YouTube</span>
                </a>
             </div>
          </section>

          {/* Theme Settings */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Appearance</h3>
             <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => onThemeChange('light')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${currentTheme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                   <Sun className="w-5 h-5" />
                   <span className="text-xs font-medium">Light</span>
                </button>
                <button 
                   onClick={() => onThemeChange('dark')}
                   className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${currentTheme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                   <Moon className="w-5 h-5" />
                   <span className="text-xs font-medium">Dark</span>
                </button>
                <button 
                   onClick={() => onThemeChange('system')}
                   className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${currentTheme === 'system' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                   <Monitor className="w-5 h-5" />
                   <span className="text-xs font-medium">System</span>
                </button>
             </div>
          </section>

          {/* API Settings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">API Configuration</h3>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Google Gemini API</label>
                    <div className="relative">
                        <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                        type="password"
                        value={localSettings.geminiApiKey}
                        onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
                        />
                    </div>
                    <div className="mt-2 flex justify-end">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            Get Gemini Key <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Remove.bg API Key</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                        type="password"
                        value={localSettings.removeBgApiKey}
                        onChange={(e) => handleChange('removeBgApiKey', e.target.value)}
                        placeholder="Enter key to use Remove.bg service"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
                        />
                    </div>
                    <div className="mt-2 flex justify-end">
                        <a href="https://www.remove.bg/api" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            Get Remove.bg Key <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
          </section>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/30 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
