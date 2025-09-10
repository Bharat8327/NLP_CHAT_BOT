import React from 'react';

const CustomCard = ({ children, className = '', onClick, ...props }) => {
  const cardClasses = `
    bg-card border border-border rounded-lg shadow-sm
    transition-all duration-200 hover:shadow-md
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

const CustomCardHeader = ({ children, className = '' }) => (
  <div className={`p-6 space-y-1.5 ${className}`}>{children}</div>
);

const CustomCardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const CustomCardTitle = ({ children, className = '' }) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight text-foreground ${className}`}
  >
    {children}
  </h3>
);

const CustomCardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

export {
  CustomCard,
  CustomCardHeader,
  CustomCardContent,
  CustomCardTitle,
  CustomCardDescription,
};
