import { useRef, useState } from 'react';

export default function OTPInput({ length = 6, value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = digits.map((d, i) => (i === idx ? '' : d));
      onChange(next.join(''));
      return;
    }
    const char = val[val.length - 1];
    const next = digits.map((d, i) => (i === idx ? char : d));
    onChange(next.join(''));
    if (idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        const next = digits.map((d, i) => (i === idx - 1 ? '' : d));
        onChange(next.join(''));
        inputs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 focus:outline-none bg-white/5 text-white"
          style={{
            border: digit ? '1.5px solid rgba(107,66,38,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
            boxShadow: digit ? '0 0 0 3px rgba(107,66,38,0.1)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
