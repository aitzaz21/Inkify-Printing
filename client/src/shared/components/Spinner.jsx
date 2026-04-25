export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
};

export const PageLoader = () => (
  <div className="fixed inset-0 bg-ink-black flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-5">
      <div className="animate-pulse" style={{ borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(201,150,122,0.2)' }}>
        <img
          src="/logo.jpg"
          alt="Inkify Printing"
          style={{
            width: 96,
            height: 96,
            borderRadius: 20,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-display font-bold tracking-widest text-white" style={{ fontSize: 18, letterSpacing: '0.18em' }}>INKIFY</span>
        <span className="font-display font-light tracking-widest text-ink-brown" style={{ fontSize: 18, letterSpacing: '0.18em' }}>PRINTING</span>
      </div>
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  </div>
);
