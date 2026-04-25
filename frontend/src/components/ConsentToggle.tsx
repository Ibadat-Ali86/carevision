import React from 'react';

interface ConsentToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ConsentToggle({ checked, onChange }: ConsentToggleProps) {
  return (
    <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
      <div className="flex items-center h-5 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-brand bg-white border-slate-300 rounded focus:ring-brand focus:ring-2"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-900">Patient Consent</span>
        <span className="text-xs text-slate-500">
          Patient agrees to save anonymized data to the offline log.
        </span>
      </div>
    </label>
  );
}
