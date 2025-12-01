export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  icon: Icon,
  ...props 
}) {
  const baseClass = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[#00c853] text-white hover:bg-[#00e75f] shadow-lg shadow-[#00c853]/30 hover:shadow-[#00c853]/50',
    secondary: 'bg-[#2ee9ff] text-[#0b0f10] hover:bg-[#54eeff] shadow-lg shadow-[#2ee9ff]/30 hover:shadow-[#2ee9ff]/50',
    outline: 'border-2 border-[#00c853] text-[#00c853] hover:bg-[#00c853]/10',
    ghost: 'text-[#f3f7f7]/70 hover:text-[#f3f7f7] hover:bg-[#2a2f31]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}
