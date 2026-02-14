
import React from 'react';

interface RiskMeterProps {
  value: number;
  label: string;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ value, label }) => {
  const getColor = (val: number) => {
    if (val < 25) return 'bg-emerald-500';
    if (val < 50) return 'bg-yellow-500';
    if (val < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-xs font-bold text-slate-400">{value}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${getColor(value)}`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

export default RiskMeter;
