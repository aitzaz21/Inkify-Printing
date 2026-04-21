import * as THREE from 'three';

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

// ---------------------------------------------------------------------------
// Shirt silhouette shapes (coordinate space: x in ~[-1.1,1.1], y in ~[-1.2,1.1])
// All shapes are symmetric about x=0 and drawn counter-clockwise.
// ---------------------------------------------------------------------------

function makeTShirtShape() {
  const s = new THREE.Shape();
  // Bottom hem
  s.moveTo(-0.55, -1.15);
  s.lineTo( 0.55, -1.15);
  // Right side body up to armpit
  s.lineTo( 0.60, -0.04);
  s.lineTo( 0.69,  0.08);
  // Right sleeve
  s.lineTo( 0.94,  0.04);
  s.lineTo( 1.04,  0.45);
  s.lineTo( 0.64,  0.51);
  // Right shoulder to collar
  s.lineTo( 0.57,  0.73);
  s.quadraticCurveTo( 0.44,  0.90,  0.15,  0.97);
  s.quadraticCurveTo( 0.07,  1.00,  0.00,  1.00);
  // Mirror: collar left to left shoulder
  s.quadraticCurveTo(-0.07,  1.00, -0.15,  0.97);
  s.quadraticCurveTo(-0.44,  0.90, -0.57,  0.73);
  // Left sleeve
  s.lineTo(-0.64,  0.51);
  s.lineTo(-1.04,  0.45);
  s.lineTo(-0.94,  0.04);
  s.lineTo(-0.69,  0.08);
  // Left side body back to start
  s.lineTo(-0.60, -0.04);
  s.lineTo(-0.55, -1.15);
  return s;
}

function makeVNeckShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.55, -1.15);
  s.lineTo( 0.55, -1.15);
  s.lineTo( 0.60, -0.04);
  s.lineTo( 0.69,  0.08);
  s.lineTo( 0.94,  0.04);
  s.lineTo( 1.04,  0.45);
  s.lineTo( 0.64,  0.51);
  s.lineTo( 0.57,  0.73);
  // V-neck right collar → V-point → V-neck left collar
  s.lineTo( 0.27,  0.87);
  s.lineTo( 0.00,  0.43);   // V-point
  s.lineTo(-0.27,  0.87);
  s.lineTo(-0.57,  0.73);
  s.lineTo(-0.64,  0.51);
  s.lineTo(-1.04,  0.45);
  s.lineTo(-0.94,  0.04);
  s.lineTo(-0.69,  0.08);
  s.lineTo(-0.60, -0.04);
  s.lineTo(-0.55, -1.15);
  return s;
}

function makePoloShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.52, -1.15);
  s.lineTo( 0.52, -1.15);
  s.lineTo( 0.57, -0.04);
  s.lineTo( 0.66,  0.08);
  s.lineTo( 0.90,  0.04);
  s.lineTo( 1.00,  0.43);
  s.lineTo( 0.61,  0.49);
  s.lineTo( 0.55,  0.69);
  // Right shoulder → polo collar
  s.quadraticCurveTo( 0.43,  0.83,  0.20,  0.91);
  // Polo collar right flap
  s.lineTo( 0.16,  1.06);
  s.quadraticCurveTo( 0.12,  1.11,  0.07,  1.09);
  s.lineTo( 0.05,  0.94);
  // Center button placket notch
  s.lineTo( 0.00,  0.96);
  s.lineTo(-0.05,  0.94);
  // Polo collar left flap (mirror)
  s.lineTo(-0.07,  1.09);
  s.quadraticCurveTo(-0.12,  1.11, -0.16,  1.06);
  s.lineTo(-0.20,  0.91);
  s.quadraticCurveTo(-0.43,  0.83, -0.55,  0.69);
  s.lineTo(-0.61,  0.49);
  s.lineTo(-1.00,  0.43);
  s.lineTo(-0.90,  0.04);
  s.lineTo(-0.66,  0.08);
  s.lineTo(-0.57, -0.04);
  s.lineTo(-0.52, -1.15);
  return s;
}

// ---------------------------------------------------------------------------
// Build extruded shirt geometry with proper normals for PBR lighting
// ---------------------------------------------------------------------------
export function createShirtGeometry(typeId) {
  let shape;
  switch (typeId) {
    case SHIRT_TYPE_IDS.POLO:  shape = makePoloShape();  break;
    case SHIRT_TYPE_IDS.VNECK: shape = makeVNeckShape(); break;
    default:                   shape = makeTShirtShape(); break;
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth:          0.07,
    bevelEnabled:   true,
    bevelThickness: 0.015,
    bevelSize:      0.012,
    bevelSegments:  3,
    curveSegments:  12,
  });

  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// Chest placement bounds in the shirt's local 3D coordinate space (after geo.center()).
// Raw shirt y range: [-1.15, ~1.0]; center ≈ -0.075 → all y coords shift +0.075.
// These bounds target the upper chest area where print graphics typically go.
export const CHEST_BOUNDS_3D = {
  minX: -0.38, maxX:  0.38,
  minY: -0.05, maxY:  0.58,
};
