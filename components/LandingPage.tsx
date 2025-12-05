
import React from 'react';
import { Upload, Image as ImageIcon, Settings, Youtube } from 'lucide-react';

interface LandingPageProps {
  onUpload: (file: File) => void;
  onOpenSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onUpload, onOpenSettings }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors duration-200">
      
      {/* Settings Button (Top Right) */}
      <div className="absolute top-4 right-4 z-10">
         <button 
           onClick={onOpenSettings}
           className="p-2.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full transition-all hover:scale-105"
         >
           <Settings className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
          
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 rotate-3 transform hover:rotate-6 transition-transform duration-300">
               <span className="text-white font-bold text-4xl">P</span>
            </div>
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Passport Photo Studio</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto leading-relaxed">
                    Professional ID photos made simple. Upload, crop, and print.
                </p>
            </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white dark:bg-gray-800 border-3 border-dashed border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-12 transition-all cursor-pointer shadow-sm hover:shadow-xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="p-5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">Upload your photo</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Supports JPG, PNG, WEBP</p>
              </div>
              <div className="mt-2">
                 <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    Click or Drag & Drop
                 </span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
             <FeatureCard icon={<ImageIcon />} title="Smart Crop" desc="Built-in cropping tool for perfect framing." />
             <FeatureCard icon={<Upload />} title="AI Background" desc="Instantly remove background with one click." />
             <FeatureCard icon={<ImageIcon />} title="Print Ready" desc="Auto-arranges photos for any paper size." />
          </div>
        </div>
      </div>
      
      {/* Footer / About Info */}
      <footer className="w-full py-6 mt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <p>Developed by <span className="font-semibold text-gray-700 dark:text-gray-300">Mirza Hasnain Baig</span></p>
            <div className="flex items-center gap-4">
                <a href="tel:+923304524169" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    +92-330-4524169
                </a>
                <span>•</span>
                <a 
                    href="https://www.youtube.com/channel/UCFLQuLM-EcOm7r8ZtvITfKA?sub_confirmation=1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#FF0000] hover:text-[#D90000] font-medium transition"
                >
                    <Youtube className="w-4 h-4 fill-current" />
                    Subscribe
                </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition">
    <div className="text-indigo-600 dark:text-indigo-400 mb-3 bg-indigo-50 dark:bg-indigo-900/20 w-fit p-2 rounded-lg">{icon}</div>
    <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">{desc}</p>
  </div>
);
