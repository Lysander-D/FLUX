export interface AudioState {
  buffer: AudioBuffer | null;
  fileName: string | null;
  duration: number;
  isProcessing: boolean;
  error: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  selectionStart: number;
  selectionEnd: number;
}

export interface WaveformProps {
  buffer: AudioBuffer;
  playbackState: PlaybackState;
  setSelection: (start: number, end: number) => void;
  seek: (time: number) => void;
}
