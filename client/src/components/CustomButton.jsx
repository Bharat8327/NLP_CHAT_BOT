import React from 'react';

const CustomButton = ({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 
        rounded-md font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset
        disabled:opacity-50 disabled:cursor-not-allowed
        bg-blue-600 text-white hover:bg-blue-700 
        h-10 px-4 py-2 text-sm
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;
