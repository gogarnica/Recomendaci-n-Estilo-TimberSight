import React, { useRef, useEffect, useCallback, useState } from 'react';

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 1280, height: 720 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("No se pudo acceder a la cámara. Por favor, verifica los permisos en tu navegador.");
      }
    };
    
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCaptureClick = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally for a mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error de Cámara</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
            onClick={onCancel}
            className="bg-gray-500 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors"
        >
            Volver
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Sonríe!</h2>
      <p className="text-gray-600 mb-4 text-center">Asegúrate de que tu rostro esté bien iluminado y centrado.</p>
      <div className="relative w-full rounded-lg overflow-hidden shadow-lg border-4 border-white aspect-video bg-gray-900">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        <div className="absolute inset-0 border-8 border-white/50 rounded-lg pointer-events-none"></div>
      </div>
      <div className="mt-6 flex space-x-4">
        <button onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 transition-colors">
          Cancelar
        </button>
        <button onClick={handleCaptureClick} className="bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-900 transition-transform transform hover:scale-105 shadow-md">
          Capturar Foto
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;