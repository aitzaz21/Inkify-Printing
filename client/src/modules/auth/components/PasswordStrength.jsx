import { validatePassword } from '../../../shared/utils/validators';

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const rules = validatePassword(password);
  const passed = rules.filter((r) => r.passed).length;
  const strength = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong';
  const colors = { Weak: '#ef4444', Fair: '#f97316', Good: '#eab308', Strong: '#22c55e' };

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= passed ? colors[strength] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {rules.map((r) => (
          <span
            key={r.message}
            className="text-xs flex items-center gap-1 transition-colors duration-200"
            style={{ color: r.passed ? '#6B4226' : 'rgba(255,255,255,0.3)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {r.passed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {r.message}
          </span>
        ))}
      </div>
    </div>
  );
}
