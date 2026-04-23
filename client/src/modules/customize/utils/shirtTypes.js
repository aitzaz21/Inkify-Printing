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
