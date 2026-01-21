
import React from 'react';
import { SavedDocument, UrgencyLevel } from '../types';

interface HistoryItemProps {
  doc: SavedDocument;
  onClick: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ doc, onClick }) => {
  const urgencyColors = {
    [UrgencyLevel.LOW]: 'bg-green-100 text-green-700',
    [UrgencyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-700',
    [UrgencyLevel.HIGH]: 'bg-orange-100 text-orange-700',
    [UrgencyLevel.CRITICAL]: 'bg-red-100 text-red-700',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4 active:scale-95 transition-all cursor-pointer"
    >
      <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
        <img src={doc.image} alt="Document" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-slate-900 truncate">{doc.summary.type}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${urgencyColors[doc.summary.urgency]}`}>
            {doc.summary.urgency}
          </span>
        </div>
        <p className="text-sm text-slate-500 truncate mb-2">{doc.summary.sender}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(doc.timestamp).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
