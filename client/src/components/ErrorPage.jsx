import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const ErrorPage = ({
  code = '404',
  title = 'Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved.",
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-height-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
            <AlertCircle size={40} />
          </div>
        </div>
        
        <h1 className="text-7xl font-extrabold text-indigo-400 tracking-tight mb-2">
          {code}
        </h1>
        <h2 className="text-2xl font-bold text-gray-100 mb-4">{title}</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">{message}</p>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
