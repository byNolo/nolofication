export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[#f3f7f7]/90 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 rounded-lg
          bg-[#0b0f10] border border-[#2a2f31]
          text-[#f3f7f7] placeholder-[#f3f7f7]/30
          focus:outline-none focus:ring-2 focus:ring-[#00c853] focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
