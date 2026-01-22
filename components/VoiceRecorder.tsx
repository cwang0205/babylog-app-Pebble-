import React, { useState, useRef } from 'react';
import { MicIcon, StopIcon } from './Icons';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm'; 
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; 
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-rust/30 transition-all duration-300 transform hover:scale-105 active:scale-95
          ${isProcessing 
            ? 'bg-charcoal cursor-not-allowed' 
            : isRecording 
              ? 'bg-rust animate-pulse ring-4 ring-rust/30' 
              : 'bg-rust hover:bg-rust/90'}
        `}
      >
        {isProcessing ? (
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : isRecording ? (
          <StopIcon className="w-8 h-8 text-white" />
        ) : (
          <MicIcon className="w-8 h-8 text-white" />
        )}
      </button>
      
      {/* Label */}
      <div className={`mt-3 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity duration-300 ${isRecording ? 'bg-rust text-white' : 'text-charcoal/50 bg-white/80 backdrop-blur-sm'}`}>
        {isProcessing ? "Analyzing..." : isRecording ? "Listening..." : "Tap to Speak"}
      </div>
    </div>
  );
};

export default VoiceRecorder;