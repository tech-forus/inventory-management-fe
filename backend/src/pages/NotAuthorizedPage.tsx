import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-lg p-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Not Authorized</h1>
        <p className="text-lg text-slate-500 font-medium mb-8">
          You don't have permission to access this page. Contact your super admin if you need access.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/app/sku"
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[13px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm"
          >
            Go to SKU
          </Link>
          <Link to="/login" className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 text-[13px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorizedPage;


