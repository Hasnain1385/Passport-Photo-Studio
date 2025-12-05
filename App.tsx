import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Printer, Download, ChevronLeft, RefreshCw, Wand2, Scissors, PaintBucket, Menu, Check, AlignLeft, AlignCenter, XCircle, AlertCircle } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { PrintPreview } from './components/PrintPreview';
import { SettingsModal } from './components/SettingsModal';
import { SimpleCropper } from './components/SimpleCropper';
import { removeBackgroundGemini, removeBackgroundRemoveBg } from './services/apiService';
import { 
  AppSettings, 
  GridConfig, 
  PaperSize, 
  PAPER_DIMENSIONS, 
  PHOTO_STANDARDS, 
  DEFAULT_PHOTO_WIDTH_MM, 
  DEFAULT_PHOTO_HEIGHT_MM,
  calculateMaxPhotos,
  ThemeMode,
  ToastMessage
} from './types';

const PRESET_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Blue', value: '#E0F2FE' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Grey', value: '#D1D5DB' },
];

const App: React.FC = () => {
  // Theme Management
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Load settings on mount
  useEffect(() => {
      const saved = localStorage.getItem('passport-app-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({...prev, ...parsed}));
        } catch (e) { console.error(e); }
      }
  }, []);

  // Navigation & Flow
  const [step, setStep] = useState<'upload' | 'crop' | 'editor'>('upload');
  
  // Data
  const [originalImage, setOriginalImage] = useState<string | null>(null); 
  const [imageSrc, setImageSrc] = useState<string | null>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentBgColor, setCurrentBgColor] = useState('#FFFFFF');

  // Config
  const [settings, setSettings] = useState<AppSettings>({ removeBgApiKey: '', geminiApiKey: '' });
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    paperSize: PaperSize.PHOTO_4X6, 
    orientation: 'landscape', 
    gap: 1,
    margin: 2,
    photoCount: 8,
    photoWidth: DEFAULT_PHOTO_WIDTH_MM,
    photoHeight: DEFAULT_PHOTO_HEIGHT_MM,
    alignment: 'center',
    autoScale: true,
  });

  const saveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      localStorage.setItem('passport-app-settings', JSON.stringify(newSettings));
      addToast('success', 'Settings saved');
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  // Calculate limits
  const maxPhotos = calculateMaxPhotos(
    gridConfig.paperSize,
    gridConfig.orientation,
    gridConfig.margin,
    gridConfig.gap,
    gridConfig.photoWidth,
    gridConfig.photoHeight
  );

  useEffect(() => {
    if (!gridConfig.autoScale && gridConfig.photoCount > maxPhotos) {
      setGridConfig(prev => ({ ...prev, photoCount: maxPhotos }));
    } else if (gridConfig.photoCount > 50) {
        setGridConfig(prev => ({ ...prev, photoCount: 50 }));
    }
  }, [maxPhotos, gridConfig.paperSize, gridConfig.orientation, gridConfig.margin, gridConfig.gap, gridConfig.autoScale]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string, width?: number, height?: number) => {
    setImageSrc(croppedImage);
    if (width && height) {
        setGridConfig(prev => ({
            ...prev,
            photoWidth: width,
            photoHeight: height
        }));
    }
    setStep('editor');
  };

  const handlePrint = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        addToast('error', 'Nothing to print');
        return;
    }

    const paper = PAPER_DIMENSIONS[gridConfig.paperSize];
    const pWidth = gridConfig.orientation === 'portrait' ? paper.width : paper.height;
    const pHeight = gridConfig.orientation === 'portrait' ? paper.height : paper.width;

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    // Create an invisible iframe to handle the print job
    const iframe = document.createElement('iframe');
    // Ensure it's hidden but part of the DOM so contentWindow exists
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) {
        addToast('error', 'Print initialization failed');
        return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Print Passport Photos</title>
          <style>
              @page { size: ${pWidth}mm ${pHeight}mm; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
              img { width: ${pWidth}mm; height: ${pHeight}mm; object-fit: contain; }
          </style>
      </head>
      <body>
          <img src="${dataUrl}" onload="setTimeout(() => { window.print(); window.parent.postMessage('printComplete', '*'); }, 100);" />
      </body>
      </html>
    `);
    doc.close();

    const cleanup = () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    };
    
    setTimeout(cleanup, 5000);
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `passport-sheet-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('success', 'Image downloaded');
    }
  };

  const handleRemoveBackground = async (provider: 'gemini' | 'removebg') => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      let resultBase64: string;
      if (provider === 'gemini') {
        // Use user's key first, then env key
        const apiKey = settings.geminiApiKey || process.env.API_KEY;
        if (!apiKey) {
            setSettingsOpen(true);
            throw new Error("Gemini API Key missing. Please add it in settings.");
        }
        resultBase64 = await removeBackgroundGemini(apiKey, imageSrc);
      } else {
        if (!settings.removeBgApiKey) {
            setSettingsOpen(true);
            throw new Error("Please enter your Remove.bg API Key in settings.");
        }
        resultBase64 = await removeBackgroundRemoveBg(settings.removeBgApiKey, imageSrc);
      }
      setImageSrc(resultBase64);
      addToast('success', 'Background removed successfully');
    } catch (err: any) {
      addToast('error', err.message || "Failed to process image");
      if (err.message && err.message.includes("API Key")) setSettingsOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentStandardKey = () => {
    const entry = Object.entries(PHOTO_STANDARDS).find(([_, std]) => 
        Math.abs(std.width - gridConfig.photoWidth) < 0.1 && 
        Math.abs(std.height - gridConfig.photoHeight) < 0.1
    );
    return entry ? entry[0] : 'CUSTOM_15_18';
  };

  // 1. Landing Page
  if (step === 'upload' || !originalImage) {
    return (
      <>
        <LandingPage 
            onUpload={handleUpload} 
            onOpenSettings={() => setSettingsOpen(true)}
        />
        <SettingsModal 
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSave={saveSettings}
            currentTheme={theme}
            onThemeChange={setTheme}
        />
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      </>
    );
  }

  // 2. Cropper Step
  if (step === 'crop') {
      return (
          <SimpleCropper 
            imageSrc={originalImage} 
            initialStandardKey={getCurrentStandardKey()}
            onCropComplete={handleCropComplete}
            onCancel={() => setStep('upload')}
          />
      );
  }

  // 3. Main Editor
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-200">
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Top Navbar */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-20 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep('upload')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Back to Upload"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
              Passport Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleDownload} className="btn-secondary hidden sm:flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 md:hidden rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Print Preview Area */}
        <main className="flex-1 overflow-auto bg-gray-100/80 dark:bg-gray-950 p-4 md:p-8 flex flex-col items-center justify-center transition-colors duration-200">
          <PrintPreview 
            imageSrc={imageSrc} 
            config={gridConfig}
            bgColor={currentBgColor}
          />
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500 font-mono">
             <span>{PAPER_DIMENSIONS[gridConfig.paperSize].name}</span>
             <span>•</span>
             <span>{gridConfig.photoCount} photos</span>
             <span>•</span>
             <span>{Math.round(gridConfig.photoWidth)}x{Math.round(gridConfig.photoHeight)}mm</span>
          </div>
        </main>

        {/* Unified Sidebar */}
        <aside 
          className={`
            absolute md:relative right-0 top-0 bottom-0 w-full md:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl md:shadow-none z-10
            transform transition-transform duration-300 ease-in-out flex flex-col
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:block'}
          `}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-5 space-y-8">
              
              {/* 1. Photo & AI Tools */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-md text-indigo-600 dark:text-indigo-300">
                            <Wand2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Image Tools</h3>
                    </div>
                    <button 
                        onClick={() => setStep('crop')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Re-crop
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <button
                        onClick={() => handleRemoveBackground('gemini')}
                        disabled={isProcessing}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition border border-indigo-200 dark:border-indigo-800 relative overflow-hidden group"
                    >
                        {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        <span className="text-xs font-medium">Auto Remove</span>
                    </button>

                    <button
                        onClick={() => settings.removeBgApiKey ? handleRemoveBackground('removebg') : setSettingsOpen(true)}
                        disabled={isProcessing}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                    >
                        {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
                        <span className="text-xs font-medium">Remove.bg</span>
                    </button>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                         <PaintBucket className="w-3 h-3" /> Background Color
                      </label>
                      <span className="text-[10px] text-gray-400">Req. transparent photo</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setCurrentBgColor(color.value)}
                          className={`w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm focus:ring-2 ring-offset-1 dark:ring-offset-gray-800 focus:ring-indigo-500 transition-transform ${currentBgColor === color.value ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-600 dark:to-gray-800 border border-gray-300 dark:border-gray-500 flex items-center justify-center cursor-pointer hover:opacity-80">
                         <input 
                            type="color" 
                            value={currentBgColor}
                            onChange={(e) => setCurrentBgColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                         />
                         <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300">+</span>
                      </div>
                   </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* 2. Paper Layout */}
              <section className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-md text-indigo-600 dark:text-indigo-300">
                      <SettingsIcon className="w-4 h-4" />
                   </div>
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white">Page Layout</h3>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="label">Paper Size</label>
                      <div className="relative">
                          <select 
                            value={gridConfig.paperSize}
                            onChange={(e) => setGridConfig({...gridConfig, paperSize: e.target.value as PaperSize})}
                            className="input-select"
                          >
                            {Object.values(PaperSize).map(size => (
                              <option key={size} value={size} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{PAPER_DIMENSIONS[size].name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                      </div>
                   </div>
                   
                   <div>
                      <label className="label">Orientation</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button 
                          onClick={() => setGridConfig({...gridConfig, orientation: 'portrait'})}
                          className={`tab-btn ${gridConfig.orientation === 'portrait' ? 'active' : ''}`}
                        >
                          Portrait
                        </button>
                        <button 
                          onClick={() => setGridConfig({...gridConfig, orientation: 'landscape'})}
                          className={`tab-btn ${gridConfig.orientation === 'landscape' ? 'active' : ''}`}
                        >
                          Landscape
                        </button>
                     </div>
                   </div>

                   <div>
                      <label className="label">Grid Alignment</label>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => setGridConfig({...gridConfig, alignment: 'top-left'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-lg transition ${gridConfig.alignment === 'top-left' ? 'active-alignment' : 'inactive-alignment'}`}
                         >
                             <AlignLeft className="w-4 h-4" /> Top-Left
                         </button>
                         <button 
                            onClick={() => setGridConfig({...gridConfig, alignment: 'center'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-lg transition ${gridConfig.alignment === 'center' ? 'active-alignment' : 'inactive-alignment'}`}
                         >
                             <AlignCenter className="w-4 h-4" /> Center
                         </button>
                     </div>
                   </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* 3. Photo Arrangement */}
              <section className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-md text-indigo-600 dark:text-indigo-300">
                      <SettingsIcon className="w-4 h-4" />
                   </div>
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white">Arrangement</h3>
                </div>

                <div>
                   <label className="label">Photo Standard</label>
                   <div className="relative">
                        <select 
                            value={getCurrentStandardKey()}
                            onChange={(e) => {
                                const std = PHOTO_STANDARDS[e.target.value];
                                if(std) setGridConfig({...gridConfig, photoWidth: std.width, photoHeight: std.height});
                            }}
                            className="input-select"
                        >
                            {Object.entries(PHOTO_STANDARDS).map(([key, std]) => (
                                <option key={key} value={key} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{std.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                   </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="label">Photo Count</label>
                      <span className="badge">{gridConfig.photoCount}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max={Math.max(20, maxPhotos)}
                      value={gridConfig.photoCount}
                      onChange={(e) => setGridConfig({...gridConfig, photoCount: parseInt(e.target.value)})}
                      className="range-slider"
                    />
                </div>

                {/* Shrink to fit toggle */}
                <div 
                    onClick={() => setGridConfig({...gridConfig, autoScale: !gridConfig.autoScale})}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Shrink to fit page</span>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${gridConfig.autoScale ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}>
                        {gridConfig.autoScale && <Check className="w-3 h-3" />}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <div className="flex justify-between items-center mb-1">
                         <label className="label">Gap</label>
                         <span className="badge">{gridConfig.gap}mm</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={gridConfig.gap}
                        onChange={(e) => setGridConfig({...gridConfig, gap: parseFloat(e.target.value)})}
                        className="range-slider"
                      />
                   </div>
                   <div>
                      <div className="flex justify-between items-center mb-1">
                         <label className="label">Margin</label>
                         <span className="badge">{gridConfig.margin}mm</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={gridConfig.margin}
                        onChange={(e) => setGridConfig({...gridConfig, margin: parseInt(e.target.value)})}
                        className="range-slider"
                      />
                   </div>
                </div>

              </section>

            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 md:hidden">
              <button onClick={() => setSidebarOpen(false)} className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
                  Close Controls
              </button>
          </div>
        </aside>

        <SettingsModal 
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSave={saveSettings}
            currentTheme={theme}
            onThemeChange={setTheme}
        />
      </div>

      <style>{`
        .label {
            @apply block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider;
        }
        .input-select {
            @apply w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2.5 pl-3 pr-8 appearance-none transition-shadow cursor-pointer bg-white dark:bg-gray-700;
        }
        .range-slider {
            @apply w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600;
        }
        .badge {
            @apply text-[10px] font-mono font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600;
        }
        .tab-btn {
            @apply text-xs py-1.5 rounded-md transition font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200;
        }
        .tab-btn.active {
            @apply bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white font-semibold;
        }
        .active-alignment {
            @apply bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium;
        }
        .inactive-alignment {
             @apply bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600;
        }
        .btn-primary {
            @apply flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition active:scale-95;
        }
        .btn-secondary {
            @apply flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition active:scale-95;
        }
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #D1D5DB;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4B5563;
        }
        /* Toast animation */
        @keyframes slideIn {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .toast-enter {
            animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Toast Component
const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`toast-enter pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-xl border ${
                        toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100' :
                        toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100' :
                        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                        {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-black/5 rounded-full transition">
                        <XCircle className="w-4 h-4 opacity-50" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default App;