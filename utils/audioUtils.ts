export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const audioBufferToWav = (buffer: AudioBuffer, start: number, end: number): Blob => {
  // Validate range
  const startFrame = Math.max(0, Math.floor(start * buffer.sampleRate));
  const endFrame = Math.min(buffer.length, Math.floor(end * buffer.sampleRate));
  const frameCount = endFrame - startFrame;
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  if (frameCount <= 0) {
    throw new Error("Invalid time range for export");
  }

  // WAV Header params
  const format = 1; // PCM
  const bitDepth = 16;
  const blockAlign = numChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = frameCount * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1size
  view.setUint16(20, format, true); // audio format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  const offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[startFrame + i];
      // Clip sample to [-1, 1]
      const s = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit integer
      const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset + (i * blockAlign) + (channel * 2), int16, true);
    }
  }

  return new Blob([view], { type: 'audio/wav' });
};
