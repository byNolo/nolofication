export default function Card({ children, className = '', glowColor = 'cyan' }) {
  const glowColors = {
    green: 'shadow-[#00c853]/10',
    cyan: 'shadow-[#2ee9ff]/10',
    none: ''
  }

  return (
    <div className={`
      bg-[#13181a] rounded-xl border border-[#2a2f31]
      shadow-xl ${glowColors[glowColor]}
      transition-all duration-200
      hover:border-[#2a2f31]/80
      ${className}
    `}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-[#2a2f31] ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-[#2a2f31] ${className}`}>
      {children}
    </div>
  )
}
