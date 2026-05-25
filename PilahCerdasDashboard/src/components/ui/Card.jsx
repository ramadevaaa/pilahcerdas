import React from 'react';

export function Card({
  children,
  onClick,
  className = '',
  variant = 'default',
  padding = 'default',
  hoverable = false,
  ...props
}) {
  const baseStyles = 'rounded-3xl border transition-all duration-300';
  
  const variants = {
    default: 'bg-white border-brand-light shadow-premium',
    glass: 'glass-card',
    green: 'bg-brand-light border-brand-primary/10 shadow-premium',
    dark: 'bg-brand-dark border-brand-dark/20 text-white shadow-premium-lg',
    flat: 'bg-[#F9FBF9] border-transparent shadow-none',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6 md:p-8',
    lg: 'p-8 md:p-10',
  };

  const hoverStyle = hoverable 
    ? 'hover:shadow-premium-lg hover:scale-[1.01] hover:border-brand-primary/15 cursor-pointer active:scale-[0.99]' 
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
