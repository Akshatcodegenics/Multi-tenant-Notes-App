import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '✨ NotesSpace - Multi-Tenant SaaS',
  description: 'A beautiful and secure multi-tenant SaaS notes application with modern UI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>" />
      </head>
      <body>
        <div className="min-h-screen relative overflow-hidden">
          {/* Enhanced Gradient Background */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
          </div>
          
          {/* Animated Background Particles */}
          <div className="particles">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 6 + 4}px`,
                  height: `${Math.random() * 6 + 4}px`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${Math.random() * 10 + 15}s`
                }}
              />
            ))}
          </div>
          
          {/* Floating Geometric Shapes */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`shape-${i}`}
                className="absolute opacity-5"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `floating ${15 + Math.random() * 10}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 10}s`
                }}
              >
                <svg
                  width={60 + Math.random() * 80}
                  height={60 + Math.random() * 80}
                  viewBox="0 0 100 100"
                  className="text-blue-300/20"
                >
                  <circle cx="50" cy="50" r="40" fill="currentColor" />
                </svg>
              </div>
            ))}
          </div>
          
          {/* 3D Watermark */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-[0.03] pointer-events-none z-0 floating select-none">
            📝
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
