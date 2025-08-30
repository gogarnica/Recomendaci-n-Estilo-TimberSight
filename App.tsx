import React, { useState, useCallback, useRef } from 'react';
import { AppState, FrameRecommendation, GlassType, FrameShape } from './types';
import WebcamCapture from './components/WebcamCapture';
import RecommendationDisplay from './components/RecommendationDisplay';
import { analyzeFaceForFrames, addFramesToImage, changeFrameColor, changeFrameStyle } from './services/geminiService';
import { CameraIcon, TimberSightLogo, UploadIcon } from './components/Icons';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<FrameRecommendation | null>(null);
  const [initialRecommendation, setInitialRecommendation] = useState<FrameRecommendation | null>(null);
  const [selectedGlassType, setSelectedGlassType] = useState<GlassType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleCapture = useCallback(async (capturedImageSrc: string) => {
    setImageSrc(capturedImageSrc);
    setAppState(AppState.ANALYZING);
    setError(null);
    setRecommendation(null);
    setInitialRecommendation(null);
    setEditedImageSrc(null);
    setSelectedGlassType(null);

    try {
      const analysisResult = await analyzeFaceForFrames(capturedImageSrc);
      setRecommendation(analysisResult);
      setInitialRecommendation(analysisResult);
      setAppState(AppState.SELECTING_TYPE);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido. Por favor, intenta de nuevo.');
      setAppState(AppState.ERROR);
    }
  }, []);
  
  const handleGenerate = async (glassType: GlassType) => {
    if (!imageSrc || !recommendation) return;
    
    setSelectedGlassType(glassType);
    setAppState(AppState.GENERATING_OVERLAY);
    try {
      const finalImageBase64 = await addFramesToImage(imageSrc, recommendation, glassType);
      setEditedImageSrc(`data:image/png;base64,${finalImageBase64}`);
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al generar la imagen.');
      setAppState(AppState.ERROR);
    }
  };
  
  const handleColorChange = async (color: string) => {
      if (!editedImageSrc) return;

      setAppState(AppState.RECOLORING);
      try {
        const finalImageBase64 = await changeFrameColor(editedImageSrc, color);
        setEditedImageSrc(`data:image/png;base64,${finalImageBase64}`);
        setAppState(AppState.RESULT);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cambiar el color.');
        setAppState(AppState.ERROR);
      }
    };
    
  const handleStyleChange = async (style: FrameShape) => {
    if (!imageSrc || !selectedGlassType || !recommendation) return;

    setAppState(AppState.RESTYLING);
    // Update the recommendation text immediately for better UX
    setRecommendation(prev => prev ? { ...prev, recommendedFrameShape: style } : null);
    
    try {
        // Use the original unedited image for style changes
        const finalImageBase64 = await changeFrameStyle(imageSrc, style, selectedGlassType);
        setEditedImageSrc(`data:image/png;base64,${finalImageBase64}`);
        setAppState(AppState.RESULT);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cambiar el estilo.');
        setAppState(AppState.ERROR);
    }
  };
  
  const handleGoToInitial = () => {
    if (!initialRecommendation || !selectedGlassType) return;
    if (recommendation?.recommendedFrameShape !== initialRecommendation.recommendedFrameShape) {
      handleStyleChange(initialRecommendation.recommendedFrameShape);
    }
  };


  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImageSrc(null);
    setEditedImageSrc(null);
    setRecommendation(null);
    setInitialRecommendation(null);
    setSelectedGlassType(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleStartCamera = () => {
    setAppState(AppState.CAPTURING);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (base64String) {
          handleCapture(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Asistente de Estilo Personalizado</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubre las monturas perfectas para ti. Nuestra IA analizará tu rostro y te dará recomendaciones con una prueba virtual fotorrealista.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button
                    onClick={handleStartCamera}
                    className="bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-900 transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center w-full sm:w-auto"
                    >
                    <CameraIcon className="w-6 h-6 mr-3" />
                    Usar Cámara
                </button>
                 <button
                    onClick={handleUploadClick}
                    className="bg-slate-700 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-800 transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center w-full sm:w-auto"
                    >
                    <UploadIcon className="w-6 h-6 mr-3" />
                    Subir Foto
                </button>
            </div>
          </div>
        );
      case AppState.CAPTURING:
        return <WebcamCapture onCapture={handleCapture} onCancel={handleReset} />;
      case AppState.ANALYZING:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Analizando tu estilo...</h2>
            <p className="text-gray-600 mb-6">Identificando la forma de tu rostro y tus rasgos.</p>
            <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-2xl">
              {imageSrc && <img src={imageSrc} alt="Captura de usuario" className="w-full h-auto" />}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <Spinner />
                 <p className="text-white mt-4 font-semibold">Procesando...</p>
              </div>
            </div>
          </div>
        );
      case AppState.SELECTING_TYPE:
        if (!imageSrc || !recommendation) {
            handleReset();
            return null;
        }
        return (
             <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={imageSrc} alt="Tu foto original" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">¡Análisis Completo!</h2>
                        <p className="text-gray-600 mb-6">Basado en tus rasgos, este es tu perfil de estilo. Ahora, elige qué quieres probar.</p>
                        
                        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 mb-6 text-left">
                            <p className="text-sm text-gray-600">Forma de rostro: <strong className="text-gray-800">{recommendation.faceShape}</strong></p>
                            <p className="text-sm text-gray-600">Montura recomendada: <strong className="text-gray-800">{recommendation.recommendedFrameShape}</strong></p>
                            <p className="text-sm text-gray-600">Color sugerido: <strong className="text-gray-800">{recommendation.recommendedColor}</strong></p>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Elige tu prueba virtual:</h3>
                        <div className="flex flex-col space-y-4">
                            <button onClick={() => handleGenerate('vista')} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-full hover:bg-slate-900 transition-transform transform hover:scale-105 shadow-md w-full">
                                Probar Gafas de Vista
                            </button>
                            <button onClick={() => handleGenerate('sol')} className="bg-slate-700 text-white font-bold py-3 px-6 rounded-full hover:bg-slate-800 transition-transform transform hover:scale-105 shadow-md w-full">
                                Probar Gafas de Sol
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
      case AppState.GENERATING_OVERLAY:
         return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Creando tu prueba virtual...</h2>
            <p className="text-gray-600 mb-6">La IA está generando tus nuevas gafas. ¡Un momento!</p>
            <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-2xl">
              {imageSrc && <img src={imageSrc} alt="Captura de usuario" className="w-full h-auto" />}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <Spinner />
                 <p className="text-white mt-4 font-semibold">Generando imagen...</p>
              </div>
            </div>
          </div>
        );
      case AppState.RESULT:
      case AppState.RECOLORING:
      case AppState.RESTYLING:
        if (editedImageSrc && recommendation && initialRecommendation) {
          return (
            <RecommendationDisplay 
              imageSrc={editedImageSrc} 
              recommendation={recommendation} 
              initialRecommendation={initialRecommendation}
              onReset={handleReset} 
              onColorChange={handleColorChange}
              onStyleChange={handleStyleChange}
              isRecoloring={appState === AppState.RECOLORING}
              isRestyling={appState === AppState.RESTYLING}
              onGoToInitial={handleGoToInitial}
              isInitialStyle={recommendation.recommendedFrameShape === initialRecommendation.recommendedFrameShape}
            />
          );
        }
        // Fallback in case of inconsistent state
        handleReset();
        return null;
      case AppState.ERROR:
        return (
            <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal</h2>
                <p className="text-gray-700 mb-6">{error}</p>
                <button
                    onClick={handleReset}
                    className="bg-slate-800 text-white font-bold py-2 px-6 rounded-full hover:bg-slate-900 transition-colors"
                >
                    Intentar de nuevo
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
        />
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <header className="absolute top-0 left-0 w-full p-6 flex items-center">
            <TimberSightLogo className="h-8 text-slate-800 w-auto" />
        </header>
        <main className="w-full max-w-5xl flex-grow flex items-center justify-center">
            {renderContent()}
        </main>
        <footer className="text-center text-gray-500 text-sm p-4 w-full">
            Desarrollado con IA de Gemini
        </footer>
        </div>
    </>
  );
};

export default App;