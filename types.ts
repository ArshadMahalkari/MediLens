export interface ExtractedDataPoint {
  item: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'High' | 'Low' | 'Critical' | 'Unknown';
  notes: string;
}

export interface ConsultationPrep {
  specialistType: string;
  reasoning: string;
  talkingPoints: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  fee: number;
  slots: string[];
  bio: string;
  rating: number;
  reviewCount: number;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  slot: string;
  patientName: string;
  patientEmail: string;
  status: 'Confirmed';
  timestamp: number;
}

export interface AnalysisResult {
  isMedicalContent: boolean;
  summary: string;
  voiceScript: string;
  trendAnalysis: string;
  extractedData: ExtractedDataPoint[];
  interpretation: string;
  doctorSummary: string;
  questionsForDoctor: string[];
  lifestyleTips: string[];
  educationalInsights: string[];
  definitions: { term: string; definition: string }[];
  consultationPrep: ConsultationPrep;
  disclaimer: string;
}

export interface SavedReport {
  id: string;
  patientEmail: string;
  timestamp: number;
  result: AnalysisResult;
}

export interface FileWithPreview extends File {
  preview?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  age: string;
  role: 'Patient' | 'Doctor';
}