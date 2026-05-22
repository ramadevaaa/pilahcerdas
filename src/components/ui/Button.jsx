import React from 'react';

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-3xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/95 hover:shadow-lg hover:shadow-brand-primary/10 active:bg-brand-dark border-0',
    secondary: 'bg-brand-light text-brand-primary hover:bg-brand-light/80 hover:shadow-md hover:shadow-brand-light/5 active:bg-brand-light/95 border-0',
    outline: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-light active:bg-brand-light/80',
    ghost: 'text-brand-primary bg-transparent hover:bg-brand-light/50 active:bg-brand-light border-0',
    danger: 'bg-brand-orange text-white hover:bg-brand-orange/95 hover:shadow-lg hover:shadow-brand-orange/15 active:bg-brand-orange/80 border-0',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs font-semibold min-h-[40px]',
    md: 'px-6 py-3.5 text-sm font-semibold min-h-[50px]',
    lg: 'px-8 py-4 text-base font-bold min-h-[56px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
