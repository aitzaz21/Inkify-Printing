// Shirt type constants — no Three.js dependency

export const SHIRT_TYPE_IDS = {
  PLAIN_TSHIRT: 'plain-tshirt',
  POLO:         'polo',
  VNECK:        'vneck',
};

export const SHIRT_TYPE_META = {
  [SHIRT_TYPE_IDS.PLAIN_TSHIRT]: { label: 'Plain T-Shirt',  description: 'Classic crew neck' },
  [SHIRT_TYPE_IDS.POLO]:         { label: 'Polo Shirt',      description: 'Collar & placket'  },
  [SHIRT_TYPE_IDS.VNECK]:        { label: 'V-Neck T-Shirt',  description: 'Deep V neckline'   },
};

// Map a shirt type name (from DB) → ShirtViewer2D shape key.
// Falls back to 'plain-tshirt' for unknown names.
export const nameToShapeKey = (name = '') => {
  const n = name.toLowerCase().replace(/[\s-]/g, '');
  if (n.includes('polo'))  return 'polo';
  if (n.includes('vneck')) return 'vneck';
  return 'plain-tshirt';
};
