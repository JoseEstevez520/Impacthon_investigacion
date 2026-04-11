import { useRef, useEffect } from 'react';

/**
 * Renders an N x N matrix as an HTML Canvas Heatmap.
 * For AlphaFold PAE: lower error -> dark blue/green. higher error -> white/red/yellow.
 */
export default function PAEHeatmap({ matrix, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!matrix || !matrix.length || !canvasRef.current) return;
    
    // N x N size
    const n = matrix.length;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set internal resolution of the canvas exactly to matrix size
    // to avoid blurring. CSS will handle the actual visual size scaling.
    canvas.width = n;
    canvas.height = n;
    
    // AlphaFold style PAE mapping: 0 -> Dark blue/green, 30 -> White
    // A strict and fast implementation using ImageData
    const imgData = ctx.createImageData(n, n);
    const data = imgData.data;
    
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const val = matrix[y][x]; 
        // Normalize 0 to ~30 (max typical PAE)
        // val = 0 -> deep blue
        // val = 30 -> white
        let norm = val / 30.0;
        if (norm > 1.0) norm = 1.0;
        if (norm < 0) norm = 0;
        
        // Simple distinct gradient from deep emerald to soft white
        // Dark: 2, 70, 50
        // Light: 250, 250, 250
        const r = Math.round(2 + (norm * (250 - 2)));
        const g = Math.round(70 + (norm * (250 - 70)));
        const b = Math.round(50 + (norm * (250 - 50)));
        
        const idx = (y * n + x) * 4;
        data[idx] = r;     // Red
        data[idx + 1] = g; // Green
        data[idx + 2] = b; // Blue
        data[idx + 3] = 255; // Alpha
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }, [matrix]);

  if (!matrix || matrix.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs text-center rounded-lg ${className}`}>
        No PAE Data
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={`image-pixelated rounded outline outline-1 outline-slate-200 dark:outline-slate-700 shadow-sm ${className}`} 
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
