import { UserProfile, Doctor, Appointment, SavedReport, AnalysisResult } from '../types';

// Internal type for DB storage including auth data
interface StoredUser extends UserProfile {
  passwordHash: string;
}

// Storage Keys
const KEYS = {
  USERS: 'medilens_users',
  APPOINTMENTS: 'medilens_appointments',
  REPORTS: 'medilens_reports'
};

// Helper to load/save from localStorage
const load = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return fallback;
  }
};

const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
};

// Internal State (Synced with localStorage)
let users: StoredUser[] = load(KEYS.USERS, []);
let appointments: Appointment[] = load(KEYS.APPOINTMENTS, []);
let reports: SavedReport[] = load(KEYS.REPORTS, []);

// Internal Logs (Silent Mode)
const internalLogs: string[] = [];

const log = (action: string, details: any) => {
  if (action === 'CANCEL_EVENT') {
    internalLogs.push(details);
  } else {
    internalLogs.push(`[${new Date().toISOString()}] ${action}: ${JSON.stringify(details)}`);
  }
};

// Simple hash simulation
const hashPassword = (password: string): string => {
  return `hashed_${btoa(password)}`;
};

// Expose logs globally for debugging via console
(window as any).showBackendLogs = () => {
  console.log("=== BACKEND LOGS ===");
  internalLogs.forEach(entry => console.log(entry));
  if (internalLogs.length === 0) console.log("No logs recorded yet.");
};

// Mock Doctors (Static)
export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Chen',
    specialization: 'General Practitioner',
    experience: 12,
    fee: 80,
    slots: ['10:00 AM', '02:30 PM', '04:00 PM'],
    bio: 'Dr. Chen focuses on preventive care and holistic health management. She has been serving the community for over a decade.',
    rating: 4.9,
    reviewCount: 124
  },
  {
    id: 'd2',
    name: 'Dr. Marcus Webb',
    specialization: 'Cardiologist',
    experience: 20,
    fee: 150,
    slots: ['09:00 AM', '11:15 AM'],
    bio: 'Renowned for his work in interventional cardiology. Dr. Webb is dedicated to heart health and patient education.',
    rating: 4.8,
    reviewCount: 89
  },
  {
    id: 'd3',
    name: 'Dr. Emily Patel',
    specialization: 'Endocrinologist',
    experience: 8,
    fee: 120,
    slots: ['01:00 PM', '03:45 PM', '05:00 PM'],
    bio: 'Specializes in diabetes management and hormonal disorders. Dr. Patel is known for her empathetic approach.',
    rating: 4.7,
    reviewCount: 56
  },
  {
    id: 'd4',
    name: 'Dr. James Wilson',
    specialization: 'Hematologist',
    experience: 15,
    fee: 135,
    slots: ['10:30 AM', '02:00 PM'],
    bio: 'Expert in blood disorders with a background in clinical research. Dr. Wilson provides cutting-edge treatments.',
    rating: 5.0,
    reviewCount: 42
  }
];

export const mockDB = {
  // Signup: Create new account if email doesn't exist
  signup: (profile: UserProfile, password: string): { success: boolean, user?: UserProfile, error?: string } => {
    const existingUser = users.find(u => u.email === profile.email);
    if (existingUser) {
      log('SIGNUP_FAIL', { reason: 'User exists', email: profile.email });
      return { success: false, error: "An account with this email already exists. Please login instead." };
    }

    const newUser: StoredUser = {
      ...profile,
      passwordHash: hashPassword(password)
    };

    users.push(newUser);
    save(KEYS.USERS, users);
    log('SIGNUP_SUCCESS', { email: newUser.email, role: newUser.role });
    
    // Return sanitized profile (no password)
    const { passwordHash, ...safeProfile } = newUser;
    return { success: true, user: safeProfile };
  },

  // Login: Verify email and hashed password
  login: (email: string, password: string): { success: boolean, user?: UserProfile, error?: string } => {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      log('LOGIN_FAIL', { reason: 'User not found', email });
      return { success: false, error: "Invalid email or password." };
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      log('LOGIN_FAIL', { reason: 'Invalid password', email });
      return { success: false, error: "Invalid email or password." };
    }

    log('LOGIN_SUCCESS', user.email);
    const { passwordHash, ...safeProfile } = user;
    return { success: true, user: safeProfile };
  },

  getDoctors: (specialtyFilter?: string) => {
    if (!specialtyFilter) return MOCK_DOCTORS;
    return MOCK_DOCTORS.filter(d => 
      d.specialization.toLowerCase().includes(specialtyFilter.toLowerCase()) || 
      specialtyFilter.toLowerCase().includes(d.specialization.toLowerCase())
    );
  },

  bookAppointment: (doctor: Doctor, slot: string, user: UserProfile): { success: boolean, appointment?: Appointment, error?: string } => {
    // 1. Check if slot is taken
    const isTaken = appointments.some(a => a.doctorId === doctor.id && a.slot === slot && a.status === 'Confirmed');
    
    if (isTaken) {
      log('BOOKING_FAIL', { reason: 'Slot taken', doctor: doctor.id, slot });
      return { success: false, error: 'This time slot is no longer available. Please choose another.' };
    }

    // 2. Create Appointment
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      slot,
      patientName: user.name,
      patientEmail: user.email,
      status: 'Confirmed',
      timestamp: Date.now()
    };

    appointments.push(newAppointment);
    save(KEYS.APPOINTMENTS, appointments);
    log('BOOKING_SUCCESS', newAppointment.id);

    return { success: true, appointment: newAppointment };
  },

  getUserAppointments: (email: string) => {
    return appointments
      .filter(appt => appt.patientEmail === email)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  cancelAppointment: (appointmentId: string, userEmail: string): { success: boolean, message?: string, error?: string } => {
    // 1. Find Appointment
    const appt = appointments.find(a => a.id === appointmentId);
    
    // 2. Validate Selection
    if (!appt) {
      log('CANCEL_FAIL', { reason: 'Not found', id: appointmentId });
      return { success: false, error: "No appointment found for that selection. Please choose a valid number or appointment_id from the list." };
    }

    // 3. Verify Ownership (Strict Backend Check)
    if (appt.patientEmail !== userEmail) {
      log('CANCEL_FAIL', { reason: 'Unauthorized', id: appointmentId, user: userEmail });
      return { success: false, error: "Unauthorized. You can only cancel your own appointments." };
    }

    // 4. Perform Cancellation
    const initialLength = appointments.length;
    appointments = appointments.filter(a => a.id !== appointmentId);
    
    if (appointments.length < initialLength) {
      save(KEYS.APPOINTMENTS, appointments);
      
      // 5. Logging (Strict format)
      // "cancelled: appointment_id by user_email at timestamp"
      const logEntry = `cancelled: ${appointmentId} by ${userEmail} at ${Date.now()}`;
      log('CANCEL_EVENT', logEntry);

      // 6. Return Structured Confirmation
      return { 
        success: true, 
        message: `Appointment cancelled:\nDoctor: ${appt.doctorName}\nTime: ${appt.slot}\nappointment_id: ${appt.id}\nNote: Your doctor has been notified (simulated).` 
      };
    }
    
    log('CANCEL_FAIL', { reason: 'Internal Error', id: appointmentId });
    return { success: false, error: "Cancellation failed due to an internal error. Please try again or type 'show backend logs' to debug." };
  },

  // --- Reports ---

  saveReport: (userEmail: string, result: AnalysisResult) => {
    const newReport: SavedReport = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      patientEmail: userEmail,
      timestamp: Date.now(),
      result
    };
    reports.push(newReport);
    save(KEYS.REPORTS, reports);
    log('REPORT_SAVED', newReport.id);
    return newReport;
  },

  getUserReports: (email: string) => {
    return reports
      .filter(r => r.patientEmail === email)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  deleteReport: (reportId: string) => {
    const initialLength = reports.length;
    reports = reports.filter(r => r.id !== reportId);
    if (reports.length < initialLength) {
      save(KEYS.REPORTS, reports);
      return { success: true };
    }
    return { success: false, error: 'Report not found.' };
  }
};
