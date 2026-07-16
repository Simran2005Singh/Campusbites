import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="text-center max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-6">
          <FiAlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-display">404</h1>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-350 mb-4 font-display">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">The page you are looking for does not exist, or you do not have permission to access it.</p>
        <Link 
          to="/login" 
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-primary-600/20 transition-all"
        >
          <FiHome className="w-4 h-4" />
          <span>Back to Safety</span>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
