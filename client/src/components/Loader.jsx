import React from 'react';

const Loader = ({ fullPage = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent rounded-full animate-spin`}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-[#e6472d] font-medium tracking-wide animate-pulse">Loading System...</p>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{spinner}</div>;
};

export default Loader;
