import React from 'react';

interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ label = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-600 border-t-transparent mb-3"></div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {content}
      </div>
    );
  }

  return content;
};
