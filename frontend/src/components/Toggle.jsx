export default function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00c853] focus:ring-offset-2 focus:ring-offset-[#13181a]
        ${enabled ? 'bg-[#00c853]' : 'bg-[#2a2f31]'}
      `}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}
