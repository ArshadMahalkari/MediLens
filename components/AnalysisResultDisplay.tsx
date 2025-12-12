import React, { useState } from 'react';
import { AnalysisResult, ExtractedDataPoint, UserProfile, Doctor, Appointment } from '../types';
import { 
  AlertTriangle, ClipboardList, Activity, Stethoscope, Heart, Info, 
  AlertCircle, BookOpen, CheckCircle, Calendar, Star, ChevronRight, Save,
  Volume2, StopCircle, TrendingUp
} from 'lucide-react';
import { mockDB } from '../services/mockDatabase';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  user: UserProfile | null;
  onLoginRequest: () => void;
}

const StatusBadge: React.FC<{ status: ExtractedDataPoint['status'] }> = ({ status }) => {
  const styles = {
    Normal: "bg-green-100 text-green-700 border-green-200",
    High: "bg-red-100 text-red-700 border-red-200",
    Low: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Critical: "bg-red-600 text-white border-red-600 font-bold",
    Unknown: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.Unknown}`}>
      {status}
    </span>
  );
};

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result, user, onLoginRequest }) => {
  // Consultation Flow States
  const [consultationStep, setConsultationStep] = useState<'intro' | 'specialist-info' | 'doctor-list' | 'slot-selection' | 'confirmation'>('intro');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleStartConsultation = () => {
    if (user) {
      setConsultationStep('specialist-info');
    } else {
      onLoginRequest();
    }
  };

  const handleShowDoctors = () => {
    setConsultationStep('doctor-list');
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingError(null);
    setConsultationStep('slot-selection');
  };

  const handleBookSlot = (slot: string) => {
    if (!user || !selectedDoctor) return;
    
    setBookingError(null);
    const response = mockDB.bookAppointment(selectedDoctor, slot, user);
    
    if (response.success && response.appointment) {
      setConfirmedAppointment(response.appointment);
      setConsultationStep('confirmation');
    } else {
      setBookingError(response.error || "Booking failed.");
    }
  };

  const handleSaveReport = () => {
    if (!user) {
      onLoginRequest();
      return;
    }
    setSaveStatus('saving');
    // Simulate slight delay for UI feel
    setTimeout(() => {
      mockDB.saveReport(user.email, result);
      setSaveStatus('saved');
      // Reset status after a few seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 600);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(result.voiceScript);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (!result.isMedicalContent) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-sm">
        <div className="flex items-start">
          <AlertTriangle className="text-yellow-500 mt-1 mr-4 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Could Not Analyze Image</h3>
            <p className="text-yellow-700 mt-1">{result.summary}</p>
            <p className="text-sm text-yellow-600 mt-2">Please ensure you upload a clear image of a medical document.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Helpers for Consultation Flow ---

  const renderSpecialistInfo = () => (
    <div className="text-left space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2 text-teal-200">
           <CheckCircle size={20} className="text-green-400" />
           <span className="text-sm font-medium">Logged in as {user?.name}</span>
         </div>
      </div>
      
      <div className="bg-white/95 text-slate-800 rounded-lg p-5 shadow-lg">
        <h4 className="font-bold text-teal-700 mb-1">Recommended Specialist</h4>
        <p className="text-lg font-semibold mb-3">{result.consultationPrep.specialistType}</p>
        
        <h4 className="font-bold text-teal-700 mb-1 text-sm">Why?</h4>
        <p className="text-sm text-slate-600 mb-4">{result.consultationPrep.reasoning}</p>
        
        <h4 className="font-bold text-teal-700 mb-2 text-sm">Your Talking Points</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 mb-4">
          {result.consultationPrep.talkingPoints.map((pt, i) => (
             <li key={i}>{pt}</li>
          ))}
        </ul>

        <button onClick={handleShowDoctors} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
          Find Doctors <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderDoctorList = () => {
    // In a real app, we'd filter by specialist type
    const doctors = mockDB.getDoctors(result.consultationPrep.specialistType) || mockDB.getDoctors();
    
    return (
      <div className="text-left animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4 text-white">
          <button onClick={() => setConsultationStep('specialist-info')} className="hover:bg-white/10 p-1 rounded"><ChevronRight size={16} className="rotate-180"/></button>
          <h3 className="font-bold">Select a Doctor</h3>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {doctors.map(doc => (
            <div key={doc.id} onClick={() => handleSelectDoctor(doc)} className="bg-white/95 p-5 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors border-l-4 border-transparent hover:border-teal-500 shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition-colors">{doc.name}</h4>
                  <p className="text-sm text-teal-600 font-medium">{doc.specialization}</p>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-bold text-slate-700">${doc.fee}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">per visit</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 border-b border-slate-100 pb-3">
                 <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> <strong>{doc.rating}</strong> ({doc.reviewCount} reviews)</span>
                 <span>•</span>
                 <span>{doc.experience} years exp.</span>
              </div>

              <p className="text-sm text-slate-600 line-clamp-2">{doc.bio}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSlotSelection = () => (
    <div className="text-left animate-fade-in-up">
       <div className="flex items-center gap-2 mb-4 text-white">
          <button onClick={() => setConsultationStep('doctor-list')} className="hover:bg-white/10 p-1 rounded"><ChevronRight size={16} className="rotate-180"/></button>
          <h3 className="font-bold">Book with {selectedDoctor?.name}</h3>
        </div>
        <div className="bg-white/95 p-5 rounded-lg">
           <div className="flex items-center gap-2 text-slate-600 mb-4">
             <Calendar size={18} />
             <span className="text-sm font-medium">Available Slots for Today</span>
           </div>

           {bookingError && (
              <div className="mb-4 bg-red-50 text-red-700 text-xs p-3 rounded border border-red-200 flex items-start gap-2">
                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                 <div>{bookingError}</div>
              </div>
           )}

           <div className="grid grid-cols-2 gap-3">
             {selectedDoctor?.slots.map(slot => (
               <button 
                key={slot} 
                onClick={() => handleBookSlot(slot)}
                className="py-2 px-3 border border-teal-100 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-sm transition-colors"
               >
                 {slot}
               </button>
             ))}
           </div>
        </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-left animate-fade-in-up text-white">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl text-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <CheckCircle size={24} />
        </div>
        <h3 className="text-xl font-bold mb-1">Appointment Confirmed!</h3>
        <p className="text-teal-100 text-sm mb-6">Booking ID: #{confirmedAppointment?.id}</p>
        
        <div className="bg-white/10 rounded-lg p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-teal-200 text-sm">Doctor</span>
            <span className="font-semibold">{confirmedAppointment?.doctorName}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-teal-200 text-sm">Time</span>
            <span className="font-semibold">{confirmedAppointment?.slot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-teal-200 text-sm">Patient</span>
            <span className="font-semibold">{confirmedAppointment?.patientName}</span>
          </div>
        </div>

        <button onClick={() => setConsultationStep('intro')} className="bg-white text-teal-800 px-6 py-2 rounded-full font-bold text-sm hover:bg-teal-50">
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Summary Card (Patient Mode) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
             <ClipboardList className="text-white" />
             <h2 className="text-lg font-bold">Report Summary</h2>
          </div>
          
          <button 
            onClick={handleSaveReport}
            disabled={saveStatus !== 'idle'}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all
              ${saveStatus === 'saved' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-white/20 text-white hover:bg-white/30'
              }
            `}
          >
            {saveStatus === 'saved' ? (
              <><CheckCircle size={14} /> Saved</>
            ) : (
              <><Save size={14} /> {saveStatus === 'saving' ? 'Saving...' : 'Save Report'}</>
            )}
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 leading-relaxed text-lg">{result.summary}</p>
        </div>
      </div>

      {/* Voice Agent Player */}
      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center text-teal-800">
                 <Volume2 size={20} />
             </div>
             <div>
                 <h3 className="font-bold text-teal-900 text-sm">Listen to Explanation</h3>
                 <p className="text-teal-700 text-xs">Audio summary of your results</p>
             </div>
         </div>
         <button 
             onClick={handleSpeak}
             className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-colors"
         >
             {isSpeaking ? <><StopCircle size={14} /> Stop</> : <><Volume2 size={14} /> Play</>}
         </button>
      </div>

      {/* Doctor Summary (Professional Mode) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-100 flex items-center gap-2">
          <Stethoscope className="text-slate-600" size={20} />
          <h3 className="font-semibold text-slate-700">Professional Brief (Doctor Mode)</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-800 font-medium font-mono text-sm leading-relaxed">
            {result.doctorSummary}
          </p>
        </div>
      </div>
      
      {/* Trend Analysis (If available) */}
      {result.trendAnalysis && !result.trendAnalysis.toLowerCase().includes("single point") && !result.trendAnalysis.toLowerCase().includes("no historical") && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center gap-2">
              <TrendingUp className="text-orange-600" />
              <h2 className="text-lg font-bold text-orange-900">Trend Analysis</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-700 leading-relaxed">{result.trendAnalysis}</p>
            </div>
         </div>
      )}

      {/* Extracted Data Table */}
      {result.extractedData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Activity className="text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">Extracted Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Test / Item</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.extractedData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.item}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{item.value}</span>
                      <span className="text-slate-500 ml-1 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.referenceRange || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 text-slate-500 italic max-w-xs">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interpretation & Implications */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
          <Info className="text-indigo-600" />
          <h2 className="text-lg font-bold text-indigo-900">Detailed Interpretation</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="prose prose-slate max-w-none text-slate-700">
             <p className="whitespace-pre-line leading-relaxed">{result.interpretation}</p>
          </div>

          {/* Educational Insights */}
          {result.educationalInsights && result.educationalInsights.length > 0 && (
             <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
               <h4 className="text-indigo-800 font-semibold mb-2 flex items-center gap-2">
                 <BookOpen size={16} /> Educational Insights
               </h4>
               <ul className="list-disc list-inside space-y-1 text-indigo-900/80 text-sm">
                 {result.educationalInsights.map((insight, idx) => (
                   <li key={idx}>{insight}</li>
                 ))}
               </ul>
             </div>
          )}
          
          {/* Definitions */}
          {result.definitions && result.definitions.length > 0 && (
            <div className="mt-4">
               <h4 className="text-slate-800 font-semibold mb-3 text-sm uppercase tracking-wide">Key Terms Defined</h4>
               <div className="grid sm:grid-cols-2 gap-3">
                 {result.definitions.map((def, idx) => (
                   <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-100">
                     <span className="font-bold text-slate-700 block mb-1">{def.term}</span>
                     <span className="text-slate-600 text-sm">{def.definition}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Questions for Doctor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
            <Stethoscope className="text-blue-600" />
            <h2 className="text-lg font-bold text-blue-900">Questions for Doctor</h2>
          </div>
          <ul className="p-6 space-y-3">
            {result.questionsForDoctor.map((q, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lifestyle Tips */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-2">
            <Heart className="text-green-600" />
            <h2 className="text-lg font-bold text-green-900">Lifestyle Suggestions</h2>
          </div>
          <ul className="p-6 space-y-3">
             {result.lifestyleTips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <div className="flex-shrink-0 mt-1">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Consultation & Booking Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl shadow-md overflow-hidden text-white">
        <div className="p-8 text-center">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-teal-200" />
          <h2 className="text-2xl font-bold mb-2">Need a Professional Opinion?</h2>
          <p className="text-teal-100 max-w-lg mx-auto mb-6">
            Our AI analysis is a great start, but nothing replaces a real doctor. 
            Connect with a specialist to discuss these results.
          </p>
          
          <div className="max-w-md mx-auto">
             {consultationStep === 'intro' && (
               <button 
                 onClick={handleStartConsultation}
                 className="bg-white text-teal-800 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-teal-50 transition-transform hover:scale-105"
               >
                 Consult a Doctor
               </button>
             )}

             {consultationStep === 'specialist-info' && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                   {renderSpecialistInfo()}
                </div>
             )}

             {consultationStep === 'doctor-list' && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                   {renderDoctorList()}
                </div>
             )}

             {consultationStep === 'slot-selection' && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                   {renderSlotSelection()}
                </div>
             )}

             {consultationStep === 'confirmation' && renderConfirmation()}
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="bg-slate-100 rounded-lg p-6 border-l-4 border-slate-400">
        <div className="flex items-start gap-3">
            <AlertCircle className="text-slate-500 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
                <strong className="block text-slate-700 mb-1">Important Disclaimer</strong>
                {result.disclaimer}
                <br className="my-2"/>
                MediLens is an AI assistant and can make mistakes. This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultDisplay;