"use client";

export const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      {/* Main loader container */}
      <div className="relative w-32 h-32">
        {/* Outer pulse ring */}
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100/30 animate-pulse-slow"></div>

        {/* Middle expanding ring */}
        <div className="absolute inset-4 rounded-full border-4 border-emerald-200/50 animate-ping-slow"></div>

        {/* Central spinning circle */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg animate-spin-slow">
          <div className="w-6 h-6 rounded-full bg-white/30"></div>
        </div>

        {/* Orbiting dots */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-orbit"
            style={{
              top: "50%",
              left: "50%",
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translate(0, -40px)`,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      {/* <p className="text-emerald-600 font-medium text-lg animate-pulse-medium">
        Securing your password...
      </p> */}

      {/* Custom animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translate(0, -40px) rotate(0deg); }
          100% { transform: rotate(360deg) translate(0, -40px) rotate(-360deg); }
        }
        @keyframes pulse-medium {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 3s ease-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-orbit {
          animation: orbit 3s ease-in-out infinite;
        }
        .animate-pulse-medium {
          animation: pulse-medium 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
