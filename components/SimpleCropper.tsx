import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, X, RotateCw, RefreshCcw } from 'lucide-react';
import { PHOTO_STANDARDS } from '../types';

interface SimpleCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string, width: number, height: number) => void;
  onCancel: () => void;
  initialStandardKey?: string;
}

export const SimpleCropper: React.FC<SimpleCropperProps> = ({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  initialStandardKey = 'CUSTOM_15_18'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // State
  const [selectedStandardKey, setSelectedStandardKey] = useState(initialStandardKey);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Derived
  const standard = PHOTO_STANDARDS[selectedStandardKey] || PHOTO_STANDARDS['CUSTOM_15_18'];
  const aspectRatio = standard.width / standard.height;

  // Reset when image changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
  }, [imageSrc]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleCrop = () => {
    const container = containerRef.current;
    const img = imageRef.current;
    
    if (!container || !img) return;

    // Use a high resolution output width for better print quality
    const outputWidth = 1200; 
    const outputHeight = outputWidth / aspectRatio;
    
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with transparency
    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Get container dimensions (the visible crop box)
    const containerRect = container.getBoundingClientRect();

    ctx.save();
    
    // 1. Move origin to center of canvas
    ctx.translate(outputWidth / 2, outputHeight / 2);
    
    // 2. Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 3. Scale & Position
    // We map the visual scale to the output canvas.
    const displayToOutputRatio = outputWidth / containerRect.width;
    const finalScale = scale * displayToOutputRatio;
    
    // Emulate CSS transform
    ctx.translate(position.x * displayToOutputRatio, position.y * displayToOutputRatio);
    ctx.scale(finalScale, finalScale);
    
    // Draw image centered relative to the transformed coordinate system
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    
    ctx.restore();

    onCropComplete(canvas.toDataURL('image/png'), standard.width, standard.height);
  };

  // Calculate Crop Box Size
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400;
  const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.8 : 400;
  
  let cropBoxHeight = Math.min(400, maxHeight);
  let cropBoxWidth = cropBoxHeight * aspectRatio;
  
  if (cropBoxWidth > maxWidth) {
      cropBoxWidth = maxWidth;
      cropBoxHeight = cropBoxWidth / aspectRatio;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white animate-fade-in">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 to-gray-950">
            
            {/* Overlay Mask */}
            <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>

            {/* The Crop Area Container - Added overflow-hidden */}
            <div 
                ref={containerRef}
                className="relative z-20 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] ring-2 ring-white/50 overflow-hidden"
                style={{ 
                    width: cropBoxWidth, 
                    height: cropBoxHeight,
                }}
            >
                {/* The Image */}
                <img 
                    ref={imageRef}
                    src={imageSrc}
                    alt="Crop target"
                    className="absolute max-w-none cursor-move touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                    } as any}
                />
                
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-40 grid grid-cols-3 grid-rows-3 border border-transparent z-30">
                    <div className="border-r border-white/70 h-full w-full col-span-1 row-span-3"></div>
                    <div className="border-r border-white/70 h-full w-full col-span-1 row-span-3"></div>
                    <div className="border-b border-white/70 h-full w-full row-span-1 col-span-3 absolute top-1/3"></div>
                    <div className="border-b border-white/70 h-full w-full row-span-1 col-span-3 absolute top-2/3"></div>
                </div>
            </div>
            
            <p className="absolute bottom-6 z-30 text-sm font-medium text-gray-400 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                Drag to pan • Scroll to zoom
            </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 pb-8 z-30 space-y-4">
            
            {/* Top Row: Standard Selector & Rotate */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                 <div className="relative">
                    <select 
                        value={selectedStandardKey}
                        onChange={(e) => setSelectedStandardKey(e.target.value)}
                        className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 pr-8 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-gray-650 transition"
                    >
                        {Object.entries(PHOTO_STANDARDS).map(([key, std]) => (
                            <option key={key} value={key}>{std.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-700 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setRotation(r => r - 90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition" title="Rotate Left">
                        <RotateCw className="w-5 h-5 text-gray-300 -scale-x-100" />
                    </button>
                    <button onClick={() => setRotation(0)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition" title="Reset Rotation">
                        <RefreshCcw className="w-4 h-4 text-gray-300" />
                    </button>
                    <button onClick={() => setRotation(r => r + 90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition" title="Rotate Right">
                        <RotateCw className="w-5 h-5 text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Middle Row: Zoom */}
            <div className="w-full max-w-lg mx-auto flex items-center gap-4 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
                <ZoomOut className="w-5 h-5 text-gray-400" />
                <input 
                    type="range" 
                    min="0.2" 
                    max="3" 
                    step="0.05" 
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <ZoomIn className="w-5 h-5 text-gray-400" />
            </div>

            {/* Bottom Row: Actions */}
            <div className="flex w-full max-w-md mx-auto gap-4 pt-2">
                <button 
                    onClick={onCancel}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                    <X className="w-5 h-5" /> Cancel
                </button>
                <button 
                    onClick={handleCrop}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" /> Done
                </button>
            </div>
        </div>
    </div>
  );
};