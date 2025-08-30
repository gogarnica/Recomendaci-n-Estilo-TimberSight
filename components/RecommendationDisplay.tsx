import React, { useState } from 'react';
import { FrameRecommendation, FrameShape } from '../types';
import { RefreshIcon, StarIcon } from './Icons';
import Spinner from './Spinner';

interface RecommendationDisplayProps {
  imageSrc: string;
  recommendation: FrameRecommendation;
  initialRecommendation: FrameRecommendation;
  onReset: () => void;
  onColorChange: (color: string) => void;
  onStyleChange: (style: FrameShape) => void;
  onGoToInitial: () => void;
  isRecoloring: boolean;
  isRestyling: boolean;
  isInitialStyle: boolean;
}

const CLASSIC_STYLES: FrameShape[] = ['Aviator', 'Round', 'Cat-eye', 'Clubmaster', 'Rectangular', 'Oval', 'Rimless'];

const METAL_COLORS = [
    { name: 'Dorado', hex: '#FFD700' },
    { name: 'Plateado', hex: '#C0C0C0' },
    { name: 'Negro', hex: '#212121' }
];

const ACETATE_COLOR_PALETTE = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Rojo', hex: '#D32F2F' },
    { name: 'Rosa', hex: '#C2185B' },
    { name: 'Morado', hex: '#7B1FA2' },
    { name: 'Morado Oscuro', hex: '#512DA8' },
    { name: 'Índigo', hex: '#303F9F' },
    { name: 'Azul', hex: '#1976D2' },
    { name: 'Azul Claro', hex: '#0288D1' },
    { name: 'Cian', hex: '#0097A7' },
    { name: 'Teal', hex: '#00796B' },
    { name: 'Verde', hex: '#388E3C' },
    { name: 'Verde Claro', hex: '#689F38' },
    { name: 'Lima', hex: '#AFB42B' },
    { name: 'Amarillo', hex: '#FBC02D' },
    { name: 'Ámbar', hex: '#FFA000' },
    { name: 'Naranja', hex: '#F57C00' },
    { name: 'Naranja Oscuro', hex: '#E64A19' },
    { name: 'Café', hex: '#5D4037' },
    { name: 'Gris', hex: '#616161' },
    { name: 'Gris Azulado', hex: '#455A64' },
    { name: 'Carey', hex: 'linear-gradient(45deg, #6b3a1a, #c48a47)' },
];


const STYLE_LABELS: Record<string, string> = {
    'Aviator': 'Aviador',
    'Round': 'Redondos',
    'Cat-eye': 'Cat-Eye',
    'Clubmaster': 'Clubmaster',
    'Rectangular': 'Rectangular',
    'Wayfarer': 'Wayfarer',
    'Oval': 'Ovalados',
    'Square': 'Cuadrados',
    'metal': 'Metal',
    'acetate': 'Acetato',
    'Rimless': '3 Piezas'
};


const RecommendationCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = "text-slate-700" }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-lg font-bold ${colorClass}`}>{STYLE_LABELS[value] || value}</p>
    </div>
);

const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ 
    imageSrc, 
    recommendation,
    initialRecommendation,
    onReset, 
    onColorChange, 
    onStyleChange,
    onGoToInitial,
    isRecoloring,
    isRestyling,
    isInitialStyle
}) => {
  const [opacityType, setOpacityType] = useState<'sólido' | 'translúcido'>('sólido');
  const isLoading = isRecoloring || isRestyling;
  const loadingText = isRecoloring ? 'Ajustando color...' : 'Cambiando estilo...';

  const isMetalStyle = ['Aviator', 'Clubmaster', 'Rimless'].includes(recommendation.recommendedFrameShape);
  
  const handleColorClick = (colorName: string) => {
    if (colorName === 'Blanco' || colorName === 'Carey') {
         onColorChange(`${colorName} sólido`);
         return;
    }
    const finalColorName = `${colorName} ${opacityType}`;
    onColorChange(finalColorName);
};


  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Left Column: Image with AI-generated glasses */}
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200">
          <img src={imageSrc} alt="Tu foto con monturas recomendadas" className="w-full h-full object-cover" />
           {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <Spinner />
                <p className="text-white mt-4 font-semibold">{loadingText}</p>
              </div>
          )}
        </div>

        {/* Right Column: Analysis */}
        <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Tu Estilo Ideal</h2>
            
            <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-500 mb-6 text-left shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center">
                    <StarIcon className="w-5 h-5 mr-2 text-amber-500" />
                    Recomendación Original de la IA
                </h3>
                <p className="text-gray-600 text-sm pl-7">
                    Estilo: <strong className="text-slate-800">{STYLE_LABELS[initialRecommendation.recommendedFrameShape] || initialRecommendation.recommendedFrameShape}</strong> |
                    Material: <strong className="text-slate-800">{STYLE_LABELS[initialRecommendation.recommendedMaterial] || initialRecommendation.recommendedMaterial}</strong>
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                 <RecommendationCard title="Forma de Rostro" value={recommendation.faceShape} />
                 <RecommendationCard title="Montura Actual" value={recommendation.recommendedFrameShape} />
                 <RecommendationCard title="Material Sugerido" value={recommendation.recommendedMaterial} colorClass="text-amber-700" />
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Justificación del Estilista</h3>
                <p className="text-gray-600 text-sm">
                    {recommendation.justification}
                </p>
            </div>
            
             <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-gray-700 mb-3">Probar otros estilos</h3>
                    <div className="flex flex-wrap gap-3 items-center">
                        <button
                            key="initial-recommendation"
                            onClick={onGoToInitial}
                            disabled={isLoading || isInitialStyle}
                            className="px-4 py-2 text-sm font-semibold rounded-full transition-colors border-2 flex items-center gap-2 bg-amber-100 text-amber-800 border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 hover:bg-amber-200 hover:border-amber-400 transform hover:scale-105"
                        >
                            <StarIcon className="w-4 h-4" />
                            Original
                        </button>
                        {CLASSIC_STYLES.map(style => (
                            <button
                                key={style}
                                onClick={() => onStyleChange(style)}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-semibold rounded-full transition-colors border-2 bg-gray-100 text-gray-700 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 hover:border-gray-400 transform hover:scale-105"
                            >
                                {STYLE_LABELS[style]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-700 mb-3">Ajustar Color de Montura</h3>
                    {isMetalStyle ? (
                        <div className="flex flex-wrap gap-3">
                            {METAL_COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => onColorChange(color.name)}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-semibold rounded-full transition-colors border-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
                                    style={{
                                        backgroundColor: color.hex,
                                        color: color.name === 'Negro' ? 'white' : '#333',
                                        borderColor: color.hex
                                    }}
                                >
                                    {color.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-gray-600 text-sm">Acabado:</h4>
                                <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-full">
                                    <button 
                                        onClick={() => setOpacityType('sólido')} 
                                        disabled={isLoading} 
                                        className={`px-4 py-1 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out ${opacityType === 'sólido' ? 'bg-white shadow-sm text-gray-800' : 'bg-transparent text-gray-500 hover:bg-gray-300/50'}`}
                                    >
                                        Sólido
                                    </button>
                                    <button 
                                        onClick={() => setOpacityType('translúcido')} 
                                        disabled={isLoading} 
                                        className={`px-4 py-1 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out ${opacityType === 'translúcido' ? 'bg-white shadow-sm text-gray-800' : 'bg-transparent text-gray-500 hover:bg-gray-300/50'}`}
                                    >
                                        Translúcido
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {ACETATE_COLOR_PALETTE.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => handleColorClick(color.name)}
                                        disabled={isLoading}
                                        className="w-8 h-8 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transform hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: color.hex }}
                                        aria-label={`Cambiar a color ${color.name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          
            <button
                onClick={onReset}
                className="bg-slate-800 text-white font-bold py-3 px-6 rounded-full hover:bg-slate-900 transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center mt-8 w-full md:w-auto self-start"
            >
                <RefreshIcon className="w-5 h-5 mr-2"/>
                Probar de Nuevo
            </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationDisplay;