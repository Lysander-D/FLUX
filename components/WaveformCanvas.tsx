import React, { useRef, useEffect } from 'react';
import { WaveformProps } from '../types';

const WaveformCanvas: React.FC<WaveformProps> = ({ 
  buffer, 
  playbackState, 
  setSelection, 
  seek 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // CRT Green Color
  const TRACE_COLOR = '#00FF41'; 
  const GRID_COLOR = 'rgba(0, 255, 65, 0.15)';

  const timeToX = (time: number, width: number, duration: number) => (time / duration) * width;
  const xToTime = (x: number, width: number, duration: number) => (x / width) * duration;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const { width, height } = canvas;
    const centerY = height / 2;

    // 1. Black Phosphor Background
    ctx.fillStyle = '#050a05';
    ctx.fillRect(0, 0, width, height);

    // 2. Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID_COLOR;
    
    // Vertical lines
    for (let i = 0; i < width; i += width / 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    // Horizontal lines
    for (let i = 0; i < height; i += height / 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // 3. Waveform
    ctx.shadowBlur = 4;
    ctx.shadowColor = TRACE_COLOR;
    ctx.strokeStyle = TRACE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2.5;

    for (let i = 0; i < width; i++) {
      let min = 1.0; 
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, centerY + min * amp);
      ctx.lineTo(i, centerY + max * amp);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Playhead (Bright Vertical Scanline)
    const playX = timeToX(playbackState.currentTime, width, buffer.duration);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5. Selection Area (Dimmed Overlay)
    const startX = timeToX(playbackState.selectionStart, width, buffer.duration);
    const endX = timeToX(playbackState.selectionEnd, width, buffer.duration);
    
    ctx.fillStyle = 'rgba(0, 50, 0, 0.5)';
    ctx.fillRect(startX, 0, endX - startX, height);
    
    // Selection Borders
    ctx.strokeStyle = TRACE_COLOR;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    let animId: number;
    const render = () => {
      draw();
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [buffer, playbackState]);

  const handlePointer = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x, rect.width, buffer.duration);

    if (e.buttons === 1) { // Left click dragging
        seek(time); // Simple seek for now, logic can be expanded for selection
    }
  };

  return (
    <div className="p-1 bg-[#111] rounded shadow-crt-inset border border-[#333]">
        <div 
          ref={containerRef}
          className="relative h-48 w-full rounded overflow-hidden cursor-crosshair touch-none"
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />
          
          {/* CRT Glass Reflection/Vignette Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.05),transparent_70%)]"></div>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
        </div>
    </div>
  );
};

export default WaveformCanvas;