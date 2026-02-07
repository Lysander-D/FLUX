import React from 'react';
import { SoundFX } from '../utils/SoundFX';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'transport' | 'stop';
  label: string;
  active?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  label, 
  active = false, 
  onClick,
  disabled,
  ...props 
}) => {
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    SoundFX.click();
    if (onClick) onClick(e);
  };

  // Base styles for the "switch" housing
  const housingClass = "relative flex flex-col items-center group select-none";
  
  // LED styles
  let ledColor = 'text-flux-amber';
  if (variant === 'transport') ledColor = 'text-flux-green';
  if (variant === 'stop') ledColor = 'text-flux-red';
  
  const ledStyle = active 
    ? `bg-current shadow-led-glow opacity-100` 
    : 'bg-[#111] shadow-inner opacity-40';

  return (
    <div className={housingClass}>
      {/* The Physical Button */}
      <button 
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-20 h-14 rounded-[2px] mb-2 outline-none
          border-t border-[#333] border-b border-[#000]
          transition-all duration-75
          ${active 
            ? 'mt-[4px] shadow-switch-on bg-[#222]' 
            : 'shadow-switch-off bg-gradient-to-b from-[#333] to-[#222] hover:from-[#3a3a3a] hover:to-[#2a2a2a]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        {...props}
      >
        {/* Tactile Texture Grip on Button Surface */}
        <div className="absolute inset-x-2 top-2 bottom-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_3px)]"></div>
      </button>

      {/* Label and LED Housing */}
      <div className="flex items-center gap-2">
         {/* The LED */}
         <div className={`w-2 h-2 rounded-full border border-[#000] ${ledColor} ${ledStyle} transition-all duration-200`}></div>
         
         {/* The Label */}
         <span className={`font-tech text-[10px] tracking-widest uppercase font-bold ${active ? 'text-gray-200' : 'text-gray-500'}`}>
            {label}
         </span>
      </div>
    </div>
  );
};

export default Button;