import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Initialize AI Client
// Note: We create a function to get the client to ensure we pick up the latest API key 
// if the user switches it (relevant for Veo/Paid features).
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Vision with Search Grounding ---
export const analyzeStrategy = async (
  prompt: string,
  base64Image?: string,
  useSearch: boolean = false
) => {
  const ai = getAiClient();
  const modelId = useSearch ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
  
  const tools = useSearch ? [{ googleSearch: {} }] : [];
  
  const parts: any[] = [];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      tools,
    }
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

// --- Image Generation ---
export const generateGameAsset = async (prompt: string, aspectRatio: string) => {
  const ai = getAiClient();
  // Using gemini-3-pro-image-preview for high quality assets
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any, 
        imageSize: "1K"
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// --- Veo Video Generation ---
export const generateVideo = async (
  prompt: string,
  inputImageBase64: string | null,
  aspectRatio: '16:9' | '9:16'
) => {
  const ai = getAiClient();
  
  let config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio
  };

  let operation;
  
  if (inputImageBase64) {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this scene cinematographically",
      image: {
        imageBytes: inputImageBase64,
        mimeType: 'image/jpeg'
      },
      config
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Fetch the actual video bytes
  const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// --- Live API (Co-Pilot) ---
export const connectToCoPilot = async (
  onAudioData: (base64: string) => void,
  onClose: () => void
) => {
  const ai = getAiClient();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => console.log('Co-Pilot Connected'),
      onmessage: (msg: LiveServerMessage) => {
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          onAudioData(audioData);
        }
      },
      onclose: () => onClose(),
      onerror: (err) => console.error(err)
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: "You are the AI co-pilot of a retro fighter jet in the game River Raid. You are intense, tactical, and brief. Use military jargon. Warn about fuel levels and enemies.",
    }
  });
};