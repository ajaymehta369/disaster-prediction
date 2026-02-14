
import React, { useState } from 'react';
import { X, AlertTriangle, Send, MapPin } from 'lucide-react';
import { UserReport } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Omit<UserReport, 'id' | 'timestamp'>) => void;
  currentLocation?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, currentLocation }) => {
  const [type, setType] = useState('Flood');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Minor' | 'Moderate' | 'Severe'>('Moderate');
  const [location, setLocation] = useState(currentLocation || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, description, severity, location });
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="glass-effect w-full max-w-lg rounded-3xl p-8 relative z-10 border-red-500/20 shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/20">
            <AlertTriangle className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Report Community Event</h3>
            <p className="text-sm text-slate-500">Share real-time conditions with others</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Event Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-red-500 transition-colors"
            >
              <option>Flood</option>
              <option>Wildfire</option>
              <option>Earthquake</option>
              <option>Severe Wind</option>
              <option>Landslide</option>
              <option>Structural Damage</option>
              <option>Other Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location / Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where is this happening?"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Severity Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Minor', 'Moderate', 'Severe'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`p-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === s 
                    ? 'bg-red-600 border-red-500 text-white' 
                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what you're seeing..."
              required
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-900/20"
          >
            <Send size={18} />
            <span>Submit Intelligence Report</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
