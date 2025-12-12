import React, { useState, useEffect } from 'react';
import { UserProfile, Appointment, SavedReport, AnalysisResult } from '../types';
import { X, Lock, CheckCircle, Calendar, Clock, User as UserIcon, FileText, Trash2, Eye } from 'lucide-react';
import { mockDB } from '../services/mockDatabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onViewReport?: (report: AnalysisResult) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, user, onLogin, onLogout, onViewReport }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    age: '',
    role: 'Patient'
  });
  const [password, setPassword] = useState('');

  // Data for logged-in user
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'reports'>('appointments');

  useEffect(() => {
    if (isOpen && user) {
      refreshData();
    } else if (isOpen && !user) {
        // Reset form when opening modal in logged-out state
        setError(null);
        setIsLoginMode(true);
        setPassword('');
    }
  }, [isOpen, user]);

  const refreshData = () => {
    if (!user) return;
    setAppointments(mockDB.getUserAppointments(user.email));
    setReports(mockDB.getUserReports(user.email));
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLoginMode) {
        const result = mockDB.login(formData.email, password);
        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            setError(result.error || "Login failed.");
        }
    } else {
        // Signup Mode
        const result = mockDB.signup(formData, password);
        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            setError(result.error || "Signup failed.");
        }
    }
  };

  const toggleMode = () => {
      setIsLoginMode(!isLoginMode);
      setError(null);
      setPassword('');
  };

  const handleCancelAppointment = (id: string, doctorName: string, slot: string) => {
    if (!user) {
      alert("You must be logged in to cancel an appointment. Type 'login' or 'signup' to continue.");
      return;
    }

    if (confirm(`Confirm cancel appointment ${doctorName} — ${slot}?`)) {
      const result = mockDB.cancelAppointment(id, user.email);
      if (result.success) {
        alert(result.message);
        refreshData();
      } else {
        alert(result.error);
      }
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const result = mockDB.deleteReport(id);
      if (result.success) {
        refreshData();
      } else {
        alert(result.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {!user ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-teal-600">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                  {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                  {isLoginMode ? 'Sign in to access your dashboard' : 'Sign up to save your appointments and reports'}
              </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">FULL NAME</label>
                    <input 
                    type="text" name="name" value={formData.name} onChange={handleInputChange} required={!isLoginMode}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="John Doe"
                    />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">EMAIL ADDRESS</label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">PASSWORD</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              {!isLoginMode && (
                  <>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">PHONE</label>
                        <input 
                        type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required={!isLoginMode}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">AGE</label>
                        <input 
                            type="number" name="age" value={formData.age} onChange={handleInputChange}
                            className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="30"
                        />
                        </div>
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">ROLE</label>
                        <select 
                            name="role" value={formData.role} onChange={handleInputChange}
                            className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                        >
                            <option value="Patient">Patient</option>
                            <option value="Doctor">Doctor</option>
                        </select>
                        </div>
                    </div>
                  </>
              )}

              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors mt-2">
                {isLoginMode ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
                <button onClick={toggleMode} className="text-sm text-teal-600 font-medium hover:underline">
                    {isLoginMode ? "New here? Sign up" : "Already have an account? Login"}
                </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            <div className="bg-teal-600 p-6 text-white shrink-0">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                   <UserIcon size={20} />
                 </div>
                 <div>
                   <h2 className="font-bold text-lg">{user.name}</h2>
                   <p className="text-teal-100 text-sm">{user.email}</p>
                 </div>
               </div>
               
               {/* Tabs */}
               <div className="flex bg-teal-700/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'appointments' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-100 hover:text-white'}`}
                  >
                    Appointments
                  </button>
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'reports' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-100 hover:text-white'}`}
                  >
                    My Reports
                  </button>
               </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
               
               {activeTab === 'appointments' ? (
                 <>
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Calendar size={18} className="text-teal-600" /> Upcoming Appointments
                   </h3>
                   {appointments.length === 0 ? (
                     <div className="text-center py-8 text-slate-400">
                       <p>You have no scheduled appointments to cancel.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {appointments.map((appt, idx) => (
                         <div key={appt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <h4 className="font-bold text-slate-800">{idx + 1}) {appt.doctorName}</h4>
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  {appt.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 pl-2">
                               <Clock size={14} />
                               <span>{appt.slot}</span>
                            </div>
                            <div className="mt-2 pl-2 flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-mono">appointment_id: {appt.id}</span>
                              <button 
                                onClick={() => handleCancelAppointment(appt.id, appt.doctorName, appt.slot)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Cancel Appointment"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </>
               ) : (
                 <>
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <FileText size={18} className="text-teal-600" /> Saved Reports
                   </h3>
                   {reports.length === 0 ? (
                     <div className="text-center py-8 text-slate-400">
                       <p>No saved reports found.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {reports.map(report => (
                         <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{report.result.summary.substring(0, 40)}...</h4>
                                <span className="text-xs text-slate-400 block mt-1">
                                  {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-50">
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-slate-400 hover:text-red-500 px-3 py-1.5 text-xs font-medium hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                              <button 
                                onClick={() => onViewReport?.(report.result)}
                                className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1"
                              >
                                <Eye size={12} /> View Report
                              </button>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </>
               )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button onClick={onLogout} className="w-full py-2 text-slate-500 font-medium hover:text-red-500 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
