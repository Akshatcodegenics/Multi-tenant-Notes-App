'use client'

// Decorative SVG components for enhanced UI
export const FloatingShapes = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Floating geometric shapes */}
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="absolute opacity-10"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 10}s`
        }}
      >
        <svg
          width={40 + Math.random() * 60}
          height={40 + Math.random() * 60}
          viewBox="0 0 100 100"
          className="text-blue-300"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      </div>
    ))}
    
    {/* Triangle shapes */}
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={`triangle-${i}`}
        className="absolute opacity-10"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${20 + Math.random() * 15}s ease-in-out infinite reverse`,
          animationDelay: `${Math.random() * 15}s`
        }}
      >
        <svg
          width={30 + Math.random() * 40}
          height={30 + Math.random() * 40}
          viewBox="0 0 100 100"
          className="text-purple-300"
        >
          <polygon
            points="50,10 90,90 10,90"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      </div>
    ))}
  </div>
)

export const HeroBanner = () => (
  <div className="relative mb-8">
    <svg
      className="absolute inset-0 w-full h-32 object-cover opacity-20"
      viewBox="0 0 1200 320"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="50%" stopColor="#764ba2" />
          <stop offset="100%" stopColor="#667eea" />
        </linearGradient>
      </defs>
      <path
        fill="url(#wave-gradient)"
        d="M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,181.3C672,181,768,235,864,234.7C960,235,1056,181,1152,181.3C1248,181,1344,235,1392,261.3L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
  </div>
)

export const NoteIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
)

export const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
  </svg>
)

export const StarIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z" />
  </svg>
)

export const TenantAvatar = ({ name, className = "w-12 h-12" }) => (
  <div className={`${className} bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
    {name?.charAt(0) || '?'}
  </div>
)

export const GradientBackground = () => (
  <div className="fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-transparent"></div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
  </div>
)