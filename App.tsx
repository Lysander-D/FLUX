import React, { useState, useRef, useEffect } from 'react';
import WaveformCanvas from './components/WaveformCanvas';
import Button from './components/Button';
import { AudioState, PlaybackState } from './types';
import { audioBufferToWav, formatTime } from './utils/audioUtils';
import { SoundFX } from './utils/SoundFX';

const App: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    buffer: null,
    fileName: null,
    duration: 0,
    isProcessing: false,
    error: null,
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    selectionStart: 0,
    selectionEnd: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new Ctx();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopPlayback();
    setAudioState(prev => ({ ...prev, isProcessing: true, fileName: file.name }));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      setAudioState({
        buffer: decodedBuffer,
        fileName: file.name,
        duration: decodedBuffer.duration,
        isProcessing: false,
        error: null,
      });

      setPlaybackState({
        isPlaying: false,
        currentTime: 0,
        selectionStart: 0,
        selectionEnd: decodedBuffer.duration,
      });

      SoundFX.engage(); // Power up sound
    } catch (err) {
      console.error(err);
      setAudioState(prev => ({ ...prev, isProcessing: false, error: "Load Failed" }));
    }
  };

  const play = () => {
    if (!audioState.buffer || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    
    if (sourceNodeRef.current) sourceNodeRef.current.stop();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioState.buffer;
    source.connect(audioContextRef.current.destination);
    
    const start = playbackState.currentTime >= audioState.duration ? 0 : playbackState.currentTime;
    
    source.start(0, start);
    sourceNodeRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime - start;

    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    SoundFX.engage();

    const update = () => {
      const now = audioContextRef.current!.currentTime;
      const trackTime = now - startTimeRef.current;
      
      if (trackTime >= audioState.duration) {
        stopPlayback();
      } else {
        setPlaybackState(prev => ({ ...prev, currentTime: trackTime }));
        rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);
  };

  const stopPlayback = () => {
    sourceNodeRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleExport = () => {
    if (!audioState.buffer) return;
    const blob = audioBufferToWav(audioState.buffer, 0, audioState.duration);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FLUX_EXPORT_${Date.now()}.wav`;
    a.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
      
      {/* Main Unit Chassis */}
      <div className="relative w-full max-w-4xl bg-flux-panel bg-brushed-dark rounded-lg shadow-plate border border-[#333]">
        
        {/* Screws */}
        <div className="absolute top-4 left-4 screw"></div>
        <div className="absolute top-4 right-4 screw"></div>
        <div className="absolute bottom-4 left-4 screw"></div>
        <div className="absolute bottom-4 right-4 screw"></div>

        <div className="p-8 md:p-12 flex flex-col gap-8">
          
          {/* Header Section */}
          <div className="flex justify-between items-end border-b-2 border-[#111] pb-6">
            {/* Branding */}
            <div className="flex flex-col">
               <h1 className="text-5xl font-brand font-black italic tracking-tighter text-chrome">
                 FLUX
               </h1>
               <span className="text-[10px] font-tech text-gray-500 tracking-[0.3em] uppercase mt-1">
                 Analog Signal Processor
               </span>
            </div>

            {/* Power Light */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-tech text-gray-600">POWER</span>
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ff0000]"></div>
            </div>
          </div>

          {/* Screen Section */}
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-tech text-gray-500">CRT DISPLAY</span>
                <span className="text-[10px] font-tech text-flux-green">
                   {audioState.fileName ? audioState.fileName.toUpperCase() : "NO SIGNAL"}
                </span>
             </div>
             
             {audioState.buffer ? (
               <WaveformCanvas 
                 buffer={audioState.buffer} 
                 playbackState={playbackState}
                 setSelection={(s, e) => setPlaybackState(prev => ({...prev, selectionStart: s, selectionEnd: e}))}
                 seek={(t) => {
                    stopPlayback();
                    setPlaybackState(prev => ({...prev, currentTime: t}));
                 }}
               />
             ) : (
                <div className="h-48 bg-black rounded border border-[#333] shadow-crt-inset flex items-center justify-center relative overflow-hidden">
                   {/* Standby static effect */}
                   <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#003300_3px)] opacity-20"></div>
                   <p className="font-tech text-flux-green animate-pulse opacity-50">INSERT TAPE TO BEGIN</p>
                </div>
             )}

             {/* Counter */}
             <div className="flex justify-center -mt-3 z-10">
                <div className="bg-[#080808] border border-[#222] px-4 py-1 rounded shadow-inner">
                   <span className="font-tech text-flux-red text-lg tracking-widest">
                     {formatTime(playbackState.currentTime)}
                   </span>
                </div>
             </div>
          </div>

          {/* Control Deck */}
          <div className="grid grid-cols-3 gap-8 pt-4">
             
             {/* I/O Section */}
             <div className="flex justify-start gap-4 border-r border-[#222] pr-8">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept="audio/*,video/*"
                />
                <Button 
                   label="LOAD TAPE" 
                   onClick={() => fileInputRef.current?.click()}
                   active={!!audioState.buffer}
                />
                <Button 
                   label="EXP. WAV" 
                   onClick={handleExport}
                   disabled={!audioState.buffer}
                />
             </div>

             {/* Transport Section */}
             <div className="flex justify-center gap-6">
                <Button 
                   variant="transport"
                   label="PLAY" 
                   onClick={play}
                   active={playbackState.isPlaying}
                   disabled={!audioState.buffer}
                />
                <Button 
                   variant="stop"
                   label="STOP" 
                   onClick={stopPlayback}
                   active={!playbackState.isPlaying && !!audioState.buffer}
                   disabled={!audioState.buffer}
                />
             </div>

             {/* Branding/Trim Section */}
             <div className="flex items-center justify-end border-l border-[#222] pl-8">
                 <div className="flex flex-col items-end opacity-40">
                    <div className="w-full h-[1px] bg-gray-500 mb-1"></div>
                    <span className="text-[9px] font-tech">HIGH FIDELITY</span>
                    <span className="text-[9px] font-tech">STEREO SOUND</span>
                    <div className="w-full h-[1px] bg-gray-500 mt-1"></div>
                 </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default App;