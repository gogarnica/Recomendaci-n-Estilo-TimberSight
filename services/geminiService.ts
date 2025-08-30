import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FrameRecommendation, GlassType, FrameShape } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Utility to convert data URL to a gemini-compatible part
function fileToGenerativePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const mimeType = match[1];
  const data = match[2];
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}


export async function analyzeFaceForFrames(base64Image: string): Promise<FrameRecommendation> {
  const imagePart = fileToGenerativePart(base64Image);

  const prompt = `
    Eres un experto estilista de moda especializado en gafas. Analiza la imagen proporcionada del rostro de una persona.
    Sigue estos pasos:
    1.  Identifica la forma del rostro (ej: Ovalada, Redonda, Cuadrada, Corazón, Diamante).
    2.  Identifica el género percibido de la persona (Hombre o Mujer).
    3.  Basado en la forma del rostro, recomienda la mejor forma de montura de gafas (ej: Aviador, Wayfarer, Redonda, Cat-eye, Rectangular, Ovalada, Cuadrada, Clubmaster, Tres Piezas (Rimless)).
    4.  Recomienda el material de la montura (metal o acetate). La elección debe ser coherente con la forma de la montura (p. ej., los 'Aviator' y 'Rimless' suelen ser de metal).
    5.  Recomienda un color de montura complementario que sea coherente con el material.
    6.  Proporciona una breve justificación (en español) para tus recomendaciones.
    7.  Identifica las coordenadas del centro del ojo izquierdo y del ojo derecho. El origen (0,0) es la esquina superior izquierda. La respuesta debe estar en píxeles absolutos de la imagen original.
    8.  Devuelve toda la respuesta como un único objeto JSON que se ajuste al esquema proporcionado. No incluyas ningún texto fuera del objeto JSON.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        seed: 42,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceShape: { type: Type.STRING, description: "La forma del rostro identificada." },
            gender: { type: Type.STRING, enum: ['Hombre', 'Mujer'], description: "El género percibido de la persona." },
            recommendedFrameShape: { 
              type: Type.STRING, 
              enum: ['Aviator', 'Wayfarer', 'Round', 'Cat-eye', 'Rectangular', 'Oval', 'Square', 'Clubmaster', 'Rimless'],
              description: "La forma de montura recomendada." 
            },
            recommendedMaterial: { type: Type.STRING, enum: ['metal', 'acetate'], description: "El material recomendado para la montura." },
            recommendedColor: { type: Type.STRING, description: "Un color de montura sugerido." },
            justification: { type: Type.STRING, description: "La justificación de la recomendación." },
            eyeCoordinates: {
              type: Type.OBJECT,
              properties: {
                leftEye: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                },
                rightEye: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          required: ["faceShape", "gender", "recommendedFrameShape", "recommendedMaterial", "recommendedColor", "justification", "eyeCoordinates"]
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FrameRecommendation;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("No se pudo obtener la recomendación de la IA. El modelo podría estar sobrecargado o la imagen no es clara.");
  }
}

export async function addFramesToImage(base64Image: string, recommendation: FrameRecommendation, glassType: GlassType): Promise<string> {
  const imagePart = fileToGenerativePart(base64Image);
  const typeDescription = glassType === 'sol' ? 'gafas de sol' : 'gafas de vista (oftálmicas)';
  const materialDescription = recommendation.recommendedMaterial === 'metal' ? 'de metal' : 'de acetato';
  const lensInstruction = glassType === 'sol' 
    ? 'Los lentes deben ser oscuros y opacos. Es FUNDAMENTAL que no tengan reflejos especulares ni brillos de fuentes de luz. La superficie del lente debe ser mate o con un color sólido, sin mostrar el reflejo del entorno.' 
    : 'CRÍTICO: Los lentes deben ser 100% transparentes, sin absolutamente NINGÚN reflejo, brillo, destello de luz o distorsión. Deben ser como un cristal perfectamente claro que permita ver los ojos de la persona sin ninguna obstrucción visual.';

  let shapeForPrompt: string = recommendation.recommendedFrameShape;
  if (recommendation.recommendedFrameShape === 'Rimless') {
    shapeForPrompt = 'Tres Piezas (sin montura/rimless)';
  } else if (recommendation.recommendedFrameShape === 'Oval') {
    shapeForPrompt = 'Ovalada (cuadrada con puntas muy redondeadas)';
  }

  const textPart = {
    text: `Sobre el rostro de la persona en la imagen, añade unas ${typeDescription} realistas ${materialDescription} con un diseño moderno y a la moda, que coincidan con esta descripción:
    - Forma de montura: ${shapeForPrompt}
    - Color de montura: ${recommendation.recommendedColor}
    Asegúrate de que las gafas se ajusten de forma natural al rostro, cubriendo los ojos correctamente y respetando la perspectiva y la iluminación de la foto. ${lensInstruction} La imagen resultante solo debe contener la persona con las gafas puestas.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data; // This is the base64 string
      }
    }
    
    // If no image part is found
    throw new Error("La IA no pudo generar la imagen de las gafas.");

  } catch (error) {
    console.error("Error calling Gemini Image Edit API:", error);
    throw new Error("No se pudo generar la prueba virtual. Por favor, intenta con otra foto.");
  }
}

export async function changeFrameColor(base64Image: string, newColor: string): Promise<string> {
  const imagePart = fileToGenerativePart(base64Image);
  
  const textPart = {
    text: `Toma esta imagen y cambia únicamente el color de la montura de las gafas a ${newColor.toLowerCase()}. Es CRÍTICO que mantengas el estilo, forma y tamaño de las gafas existentes. No alteres el rostro de la persona ni el fondo. Lo más importante: los lentes deben mantener su estado original (transparente u oscuro) pero eliminando CUALQUIER reflejo o brillo existente y sin añadir ninguno nuevo. La imagen final debe ser idéntica a la original, excepto por el color de la montura y la ausencia total de reflejos en los lentes.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data; // This is the base64 string
      }
    }
    
    throw new Error("La IA no pudo generar la variación de color.");

  } catch (error) {
    console.error("Error calling Gemini Image Edit API for color change:", error);
    throw new Error("No se pudo cambiar el color de las gafas. Por favor, intenta de nuevo.");
  }
}


export async function changeFrameStyle(base64Image: string, newStyle: FrameShape, glassType: GlassType): Promise<string> {
  const imagePart = fileToGenerativePart(base64Image);
  const typeDescription = glassType === 'sol' ? 'gafas de sol' : 'gafas de vista (oftálmicas)';
  const lensInstruction = glassType === 'sol'
    ? 'Los lentes deben ser oscuros y opacos. Es FUNDAMENTAL que no tengan reflejos especulares ni brillos de fuentes de luz. La superficie del lente debe ser mate o con un color sólido, sin mostrar el reflejo del entorno.'
    : 'CRÍTICO: Los lentes deben ser 100% transparentes, sin absolutamente NINGÚN reflejo, brillo, destello de luz o distorsión. Deben ser como un cristal perfectamente claro que permita ver los ojos de la persona sin ninguna obstrucción visual.';
  
  const material = ['Aviator', 'Clubmaster', 'Rimless'].includes(newStyle) ? 'metal' : 'acetate';
  const materialDescription = material === 'metal' ? 'de metal' : 'de acetato';

  let shapeForPrompt: string = newStyle;
  if (newStyle === 'Rimless') {
    shapeForPrompt = 'Tres Piezas (sin montura/rimless)';
  } else if (newStyle === 'Oval') {
    shapeForPrompt = 'Ovalada (cuadrada con puntas muy redondeadas)';
  }

  const textPart = {
    text: `Usando la foto original de la persona, añade unas ${typeDescription} realistas ${materialDescription} con un diseño moderno y a la moda del siguiente estilo:
    - Forma de montura: ${shapeForPrompt}
    Asegúrate de que las gafas se ajusten de forma natural al rostro, cubriendo los ojos correctamente y respetando la perspectiva y la iluminación de la foto. ${lensInstruction} La imagen resultante solo debe contener la persona con las nuevas gafas puestas.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data; // This is the base64 string
      }
    }
    
    throw new Error("La IA no pudo generar el nuevo estilo de gafas.");

  } catch (error) {
    console.error("Error calling Gemini Image Edit API for style change:", error);
    throw new Error("No se pudo cambiar el estilo de las gafas. Por favor, intenta de nuevo.");
  }
}