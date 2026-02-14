
import React from 'react';
import { DisasterRisk } from '../types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import RiskMeter from './RiskMeter';

interface RiskCardProps {
  risk: DisasterRisk;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const severityColors = {
    Low: 'text-emerald-400 bg-emerald-400/10',
    Medium: 'text-yellow-400 bg-yellow-400/10',
    High: 'text-orange-400 bg-orange-400/10',
    Critical: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="glass-effect rounded-2xl p-6 border-slate-800/50 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${severityColors[risk.severity as keyof typeof severityColors] || 'text-slate-400 bg-slate-800'}`}>
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-xl font-bold italic tracking-tight uppercase text-slate-100">{risk.type}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${severityColors[risk.severity as keyof typeof severityColors] || 'bg-slate-800 text-slate-500'}`}>
          {risk.severity}
        </span>
      </div>

      <RiskMeter value={risk.probability} label="Impact Probability" />

      <p className="text-slate-400 text-sm mb-6 leading-relaxed italic">
        {risk.description}
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
          <ShieldCheck size={14} />
          <span>Safety Protocols</span>
        </div>
        <ul className="space-y-2">
          {risk.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-500 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1 shrink-0"></span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RiskCard;
