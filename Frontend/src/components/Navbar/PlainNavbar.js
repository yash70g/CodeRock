import React from 'react';

function PlainNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-slate-900/90 to-slate-900/70 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-900 font-mono flex items-center justify-center shadow-sm">
              CR
            </div>
            <span className="text-white text-lg font-semibold tracking-wide">CodeRock</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export default PlainNavbar;
