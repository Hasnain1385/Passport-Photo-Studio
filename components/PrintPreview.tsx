
import React from 'react';
import { GridConfig, PAPER_DIMENSIONS } from '../types';

interface PrintPreviewProps {
  imageSrc: string | null;
  config: GridConfig;
  bgColor: string;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  imageSrc,
  config,
  bgColor
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Determine actual dimensions for CSS logic
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const widthMm = config.orientation === 'portrait' ? paper.width : paper.height;
  const heightMm = config.orientation === 'portrait' ? paper.height : paper.width;

  // Effect to draw canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paper = PAPER_DIMENSIONS[config.paperSize];
    
    // Determine actual dimensions based on orientation
    const paperWidthMm = config.orientation === 'portrait' ? paper.width : paper.height;
    const paperHeightMm = config.orientation === 'portrait' ? paper.height : paper.width;

    // Set actual canvas resolution (300 DPI)
    // 1mm = 0.03937 inch * 300 dpi = 11.81 px
    const pxPerMm = 11.81; 
    const widthPx = Math.floor(paperWidthMm * pxPerMm);
    const heightPx = Math.floor(paperHeightMm * pxPerMm);
    
    // Resize canvas if needed
    if (canvas.width !== widthPx || canvas.height !== heightPx) {
        canvas.width = widthPx;
        canvas.height = heightPx;
    }

    // Clear and set white paper background
    ctx.clearRect(0, 0, widthPx, heightPx);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // If no image, just show white paper
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
        let marginPx = config.margin * pxPerMm;
        const gapPx = config.gap * pxPerMm;
        
        let photoW = config.photoWidth * pxPerMm;
        let photoH = config.photoHeight * pxPerMm;
        
        // --- Auto Scale Logic ---
        const availWidth = widthPx - (marginPx * 2);
        const availHeight = heightPx - (marginPx * 2);

        let cols = Math.floor((availWidth + gapPx) / (photoW + gapPx));
        let rows = Math.ceil(config.photoCount / Math.max(1, cols));
        
        if (config.autoScale) {
            const totalH = rows * photoH + (rows - 1) * gapPx;
            
            if (totalH > availHeight || (cols * rows < config.photoCount)) {
                let bestScale = 0;
                let bestCols = 1;
                
                for (let c = 1; c <= config.photoCount; c++) {
                    const r = Math.ceil(config.photoCount / c);
                    
                    const reqW = c * photoW + (c - 1) * gapPx;
                    const reqH = r * photoH + (r - 1) * gapPx;
                    
                    const scaleX = availWidth / reqW;
                    const scaleY = availHeight / reqH;
                    const scale = Math.min(scaleX, scaleY);
                    
                    if (scale > bestScale) {
                        bestScale = scale;
                        bestCols = c;
                    }
                }
                
                if (bestScale < 1.0) {
                   const scaleFactor = bestScale * 0.99; // 1% safety margin
                   photoW *= scaleFactor;
                   photoH *= scaleFactor;
                   cols = bestCols;
                }
            }
        }
        
        if (!config.autoScale) {
            cols = Math.floor((availWidth + gapPx + 1) / (photoW + gapPx));
            if (cols < 1) cols = 1;
        }

        // --- Alignment & Drawing ---

        const totalBlockWidth = cols * photoW + (cols - 1) * gapPx;
        const finalRows = Math.ceil(config.photoCount / cols);
        const totalBlockHeight = finalRows * photoH + (finalRows - 1) * gapPx;
        
        let startX = marginPx;
        let startY = marginPx;

        if (config.alignment === 'center') {
            startX = (widthPx - totalBlockWidth) / 2;
            startY = (heightPx - totalBlockHeight) / 2;
            
            // Respect minimum margins even when centering
            startX = Math.max(marginPx, startX);
            startY = Math.max(marginPx, startY);
        }

        let count = 0;
        let row = 0;
        let col = 0;

        while (count < config.photoCount) {
            const x = startX + col * (photoW + gapPx);
            const y = startY + row * (photoH + gapPx);

            if (!config.autoScale && (x + photoW > widthPx || y + photoH > heightPx)) {
               break; 
            }

            // 1. Draw Background Color (Draw a solid rect behind the image)
            // Even if the image has transparency, this will show through.
            if (bgColor && bgColor !== '#FFFFFF' && bgColor !== 'white') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(photoW), Math.ceil(photoH));
            }

            // 2. Draw Image (Contain fit to preserve aspect ratio)
            const imgRatio = img.width / img.height;
            const targetRatio = photoW / photoH;
            
            let sWidth, sHeight, sx, sy;

            // We want to fill the box
            if (imgRatio > targetRatio) {
                // Image is wider
                sHeight = img.height;
                sWidth = img.height * targetRatio;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                // Image is taller
                sWidth = img.width;
                sHeight = img.width / targetRatio;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, photoW, photoH);
            ctx.clip();
            ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, photoW, photoH);
            ctx.restore();
            
            // 3. Draw Cut Lines (Thin gray line)
            ctx.strokeStyle = '#D1D5DB'; // Gray-300
            ctx.lineWidth = 1; 
            ctx.strokeRect(x, y, photoW, photoH);

            count++;
            col++;
            if (col >= cols) {
                col = 0;
                row++;
            }
        }

        // --- Marketing Footer ---
        // Draw text at the bottom right of the page
        const footerText = "Passport Photo Studio • +92-330-4524169";
        const fontSize = 2.5 * pxPerMm; // ~2.5mm height (approx 7-8pt)
        ctx.font = `500 ${fontSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        const footerX = widthPx - (3 * pxPerMm); // 3mm from right edge
        const footerY = heightPx - (2 * pxPerMm); // 2mm from bottom edge

        // Draw white outline/glow for visibility if it overlaps photos
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = fontSize * 0.2; // Outline width relative to font
        ctx.strokeText(footerText, footerX, footerY);

        // Draw Text
        ctx.fillStyle = '#6B7280'; // Gray-500
        ctx.fillText(footerText, footerX, footerY);
    };

  }, [imageSrc, config, bgColor]);

  return (
    <div className="h-full w-full flex items-center justify-center p-4 rounded-xl overflow-auto">
        <div className="shadow-[0_0_20px_rgba(0,0,0,0.1)] bg-white relative transition-all duration-300">
            <canvas 
                ref={canvasRef} 
                className="max-h-[80vh] max-w-full object-contain block mx-auto bg-white"
                style={{ 
                   height: 'auto', 
                   width: 'auto',
                } as React.CSSProperties}
            />
        </div>
    </div>
  );
};
