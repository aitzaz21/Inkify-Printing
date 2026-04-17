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
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-display font-bold tracking-widest text-gradient">INKIFY</div>
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  </div>
);
