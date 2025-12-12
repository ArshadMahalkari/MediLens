import React from 'react';
import { Activity, User } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenProfile }) => {
  return (
    <header className="bg-white border-b border-teal-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-teal-700">
          <div className="p-2 bg-teal-600 rounded-lg text-white">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MediLens</h1>
            <p className="text-xs text-teal-600 font-medium">AI Medical Report Assistant</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <button 
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors px-3 py-2 rounded-lg hover:bg-teal-50"
          >
            <User size={18} />
            {user ? user.name : "Login / Sign Up"}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
