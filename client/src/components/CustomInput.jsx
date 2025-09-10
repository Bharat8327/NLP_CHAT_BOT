import React from 'react';

const CustomInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 border border-border bg-input rounded-md text-sm text-foreground
    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
    placeholder-muted-foreground transition-all duration-200
    ${className}
  `;

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={inputClasses}
      required={required}
      {...props}
    />
  );
};

export default CustomInput;
