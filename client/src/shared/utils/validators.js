export const validatePassword = (password) => {
  const rules = [
    { test: /.{8,}/, message: 'At least 8 characters' },
    { test: /[A-Z]/, message: 'One uppercase letter' },
    { test: /[a-z]/, message: 'One lowercase letter' },
    { test: /[0-9]/, message: 'One number' },
    { test: /[@$!%*?&#^()_+\-=]/, message: 'One special character' },
  ];
  return rules.map((r) => ({ ...r, passed: r.test.test(password) }));
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
