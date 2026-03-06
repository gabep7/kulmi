// kulmi = "the peak/summit" in albanian — the mark is a minimal apex

export default function Logo({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kulmi"
    >
      {/* outer peak */}
      <polygon points="12,2 22,20 2,20" stroke="#111111" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* inner peak — the summit within the summit */}
      <polygon points="12,8 17,17 7,17" stroke="#111111" strokeWidth="1.5" fill="#111111" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
