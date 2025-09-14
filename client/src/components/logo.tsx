export function Logo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#4F46E5", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#06B6D4", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path 
          d="M20 35 C20 20, 35 20, 50 35 C65 20, 80 20, 80 35 C80 50, 65 50, 50 35 C35 50, 20 50, 20 35 Z" 
          fill="url(#logoGradient)" 
          stroke="none" 
          strokeWidth="0"
        />
        <circle cx="50" cy="65" r="12" fill="url(#logoGradient)" />
        <circle cx="65" cy="55" r="8" fill="url(#logoGradient)" />
      </svg>
    </div>
  );
}
