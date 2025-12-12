import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isMedicalContent: {
      type: Type.BOOLEAN,
      description: "True if the image appears to be a medical report, prescription, or health-related document. False otherwise.",
    },
    summary: {
      type: Type.STRING,
      description: "A clear, simple summary of the findings for a PATIENT. If data is inconsistent, mention it cautiously.",
    },
    voiceScript: {
      type: Type.STRING,
      description: "A natural, conversational paragraph (approx 100 words) summarizing the report as if a friendly nurse is talking to the patient. Avoid complex numbers unless necessary. Be reassuring and clear.",
    },
    trendAnalysis: {
      type: Type.STRING,
      description: "Analyze any historical data present in the image (e.g., 'Previous' columns). If trends are found, explain them (e.g., 'Your cholesterol has improved since the last test'). If no historical data is in the image, state that.",
    },
    extractedData: {
      type: Type.ARRAY,
      description: "List of specific test results, medicines, or vitals extracted from the image.",
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Name of the test, medicine, or parameter." },
          value: { type: Type.STRING, description: "The numerical value or dosage found." },
          unit: { type: Type.STRING, description: "The unit of measurement (e.g., mg/dL, mg, bpm)." },
          referenceRange: { type: Type.STRING, description: "The standard reference range listed, if available." },
          status: { 
            type: Type.STRING, 
            enum: ["Normal", "High", "Low", "Critical", "Unknown"],
            description: "The status of the result based on the reference range." 
          },
          notes: { type: Type.STRING, description: "Brief context on what the test measures or specific instructions." },
        },
        required: ["item", "value", "status"],
      },
    },
    interpretation: {
      type: Type.STRING,
      description: "A cohesive, PATIENT-FRIENDLY explanation. Group related abnormal findings into single paragraphs. Use simple cause-and-effect reasoning. Provide context for what tests measure.",
    },
    doctorSummary: {
      type: Type.STRING,
      description: "A concise, professional summary formatted for a healthcare provider (Doctor Mode). Use medical terminology where appropriate.",
    },
    questionsForDoctor: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 practical, non-diagnostic questions directly tied to the specific results.",
    },
    lifestyleTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "General suggestions focusing on hydration, nutrition, rest, and healthy routines. No treatment advice.",
    },
    educationalInsights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "General educational notes about commonly paired tests, typical factors affecting values, or what to monitor.",
    },
    definitions: {
      type: Type.ARRAY,
      description: "Definitions for complex medical terms found in the report.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The medical term." },
          definition: { type: Type.STRING, description: "A simple, easy-to-understand definition." },
        },
      },
    },
    consultationPrep: {
      type: Type.OBJECT,
      description: "Information to prepare the user for a doctor's consultation.",
      properties: {
        specialistType: { type: Type.STRING, description: "The type of specialist recommended (e.g., Cardiologist, General Practitioner)." },
        reasoning: { type: Type.STRING, description: "Why this specialist is relevant based on the findings." },
        talkingPoints: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Key points or symptoms the user should discuss during the consultation."
        },
      },
    },
    disclaimer: {
      type: Type.STRING,
      description: "The mandatory medical disclaimer.",
    },
  },
  required: ["isMedicalContent", "summary", "voiceScript", "trendAnalysis", "extractedData", "interpretation", "doctorSummary", "questionsForDoctor", "lifestyleTips", "educationalInsights", "definitions", "consultationPrep", "disclaimer"],
};

export const analyzeMedicalImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  const prompt = `
    You are MediLens, an AI assistant. Analyze the medical document in the image with a calm, educational tone.

    **Role & Tone:**
    - Default to **Patient Mode**: Simple, friendly, easy to understand.
    - Also provide a **Doctor Mode** summary: Professional, concise, structured.

    **Instructions:**

    1. **Data Extraction**: 
       - Extract names, values, units, ranges, and status.
       - In 'notes', add concise context (e.g., "Measures kidney function").

    2. **Interpretation & Reasoning (Patient Mode)**:
       - **Causal Chains**: For abnormal values, use "cause → effect" reasoning (e.g., "Low iron -> less oxygen -> fatigue").
       - **Combined Insight**: Explain the collective meaning of related values (e.g. lipid profile) in a single paragraph.
       - **Context**: Briefly explain what tests measure.

    3. **Voice Agent Script**:
       - Write a short, conversational paragraph in 'voiceScript' that can be read aloud to the patient. It should sound human, empathetic, and reassuring. Focus on the big picture, avoid reciting raw data tables.

    4. **Trend Analysis**:
       - Look for "Previous" or "History" columns in the image. If found, compare with current values in 'trendAnalysis'. If not, state that the report captures a single point in time.

    5. **Doctor-Friendly Summary (Professional Mode)**:
       - Create a concise summary using standard medical terminology suitable for a physician to quickly grasp the case.

    6. **Health Literacy Support**:
       - Define complex terms in the 'definitions' section.

    7. **Educational Insights**:
       - Add general notes on paired tests or factors affecting values.

    8. **Consultation Prep**:
       - Suggest a relevant specialist type.
       - List key talking points for the consultation.

    9. **Questions & Lifestyle**:
       - 3-5 non-diagnostic questions.
       - General wellness tips (hydration, sleep, nutrition).

    10. **Organization**:
       - Keep sections tidy. If data is inconsistent, mention it cautiously.

    If the image is not a medical document, set 'isMedicalContent' to false.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a helpful, professional, and cautious medical AI assistant. You speak in simple terms suitable for laypeople, but also provide professional summaries for doctors. You never diagnose, only interpret data.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};