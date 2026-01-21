
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, actions }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-hidden relative">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {title || 'SD Tradutor'}
          </h1>
        </div>
        <div className="flex gap-2">
          {actions}
        </div>
      </header>
      <main className="flex-1 flex flex-col p-4">
        {children}
      </main>
    </div>
  );
};
