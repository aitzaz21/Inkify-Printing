import { Suspense, useRef, useImperativeHandle, forwardRef, lazy, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '../../../shared/components/Spinner';

const ShirtMesh3D = lazy(() =>
  import('../../customize/components/ShirtMesh3D').then(m => ({ default: m.ShirtMesh3D }))
);

// Inner component inside Canvas — exposes capture() via ref
const Capturer = forwardRef(function Capturer(_, ref) {
  const { gl, scene, camera } = useThree();
  useImperativeHandle(ref, () => ({
    capture() {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    },
  }));
  return null;
});

function PreviewCanvas({ shirtTypeId, colorHex, designUrl, designTransform, orbitRef, captureRef }) {
  const dt = designTransform || { x: 0.5, y: 0.55, scale: 1.0, rotation: 0 };
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 42 }}
      dpr={[1, 2]}
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#111111']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, -2, 3]} intensity={0.2} color="#b0b0ff" />
      <pointLight position={[0, 3, -2]} intensity={0.15} color="#ffffff" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <ShirtMesh3D
          typeId={shirtTypeId || 'plain-tshirt'}
          color={colorHex || '#FFFFFF'}
          designImage={designUrl || null}
          designX={dt.x}
          designY={dt.y}
          designScale={dt.scale}
          designRot={dt.rotation}
          showPrintArea={false}
        />
        <ContactShadows position={[0, -1.45, 0]} opacity={0.4} scale={5} blur={2.8} far={1.6} />
      </Suspense>

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom
        minDistance={2.2}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.78}
        autoRotate={false}
        makeDefault
      />

      <Capturer ref={captureRef} />
    </Canvas>
  );
}

export function ShirtOrderPreview3D({ order, item, onClose }) {
  const orbitRef  = useRef(null);
  const captureRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSaveScreenshot = () => {
    if (!captureRef.current) return;
    setSaving(true);
    try {
      const dataUrl = captureRef.current.capture();
      const link    = document.createElement('a');
      link.href     = dataUrl;
      link.download = `${order.orderNumber}-shirt-preview.png`;
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Screenshot failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDesign = () => {
    if (!item.designUrl) return;
    const link    = document.createElement('a');
    link.href     = item.designUrl;
    link.download = `${order.orderNumber}-design.png`;
    link.target   = '_blank';
    link.rel      = 'noopener noreferrer';
    link.click();
  };

  const dt = item.designTransform;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-3xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#8B5A3C] mb-0.5">3D Order Preview</p>
            <h3 className="font-display text-lg font-bold text-white">{order.orderNumber}</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {order.user?.firstName} {order.user?.lastName} · {item.color} · {item.size} · ×{item.quantity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">

          {/* 3D Viewer */}
          <div className="relative" style={{ aspectRatio: '1', minHeight: 320, background: '#0d0d0d' }}>
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center gap-3 flex-col">
                <Spinner size="lg" className="text-[#8B5A3C]" />
                <p className="text-white/30 text-xs">Loading 3D preview…</p>
              </div>
            }>
              <PreviewCanvas
                shirtTypeId={item.shirtTypeId}
                colorHex={item.colorHex}
                designUrl={item.designUrl}
                designTransform={item.designTransform}
                orbitRef={orbitRef}
                captureRef={captureRef}
              />
            </Suspense>

            {/* Viewer hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white/35 text-xs">Drag to rotate · Scroll to zoom</p>
            </div>
          </div>

          {/* Right panel — order details + actions */}
          <div className="flex flex-col border-l border-white/[0.07]">

            {/* Item specs */}
            <div className="p-5 space-y-3 border-b border-white/[0.07]">
              <p className="text-xs tracking-widest uppercase text-white/25">Item Details</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/30">Shirt Style</p>
                  <p className="text-white font-medium">{item.shirtType || item.productName}</p>
                  {item.shirtTypeId && <p className="text-white/20 font-mono text-[10px]">{item.shirtTypeId}</p>}
                </div>
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/30">Color</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" style={{ background: item.colorHex || '#FFFFFF' }} />
                    <p className="text-white font-medium">{item.color}</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/30">Size & Qty</p>
                  <p className="text-white font-medium">{item.size} × {item.quantity}</p>
                </div>
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/30">Total</p>
                  <p className="text-white font-medium">PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}</p>
                </div>
              </div>

              {/* Design placement */}
              {dt && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(107,66,38,0.08)', border: '1px solid rgba(107,66,38,0.2)' }}>
                  <p className="text-[#8B5A3C] text-xs font-medium">Design Placement</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-white/30">Position X</span>
                      <span className="text-white ml-1 font-mono">{(dt.x * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-white/30">Position Y</span>
                      <span className="text-white ml-1 font-mono">{(dt.y * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-white/30">Scale</span>
                      <span className="text-white ml-1 font-mono">{dt.scale?.toFixed(2)}×</span>
                    </div>
                    <div>
                      <span className="text-white/30">Rotation</span>
                      <span className="text-white ml-1 font-mono">{dt.rotation?.toFixed(0)}°</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer note */}
              {item.designNote && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <p className="text-blue-400/70 text-xs font-medium mb-1">Customer Note</p>
                  <p className="text-white/60 text-xs italic">"{item.designNote}"</p>
                </div>
              )}
            </div>

            {/* Design image preview */}
            {item.designUrl && (
              <div className="p-5 border-b border-white/[0.07]">
                <p className="text-xs tracking-widest uppercase text-white/25 mb-3">Design File</p>
                <div className="rounded-xl overflow-hidden mb-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <img
                    src={item.designUrl}
                    alt="Customer design"
                    className="w-full max-h-40 object-contain p-3"
                  />
                </div>
                <button
                  onClick={handleDownloadDesign}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.28)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download Design File
                </button>
              </div>
            )}

            {/* Screenshot action */}
            <div className="p-5 mt-auto">
              <button
                onClick={handleSaveScreenshot}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 4px 16px rgba(107,66,38,0.4)' }}
              >
                {saving ? (
                  <><Spinner size="sm" className="text-white" /> Capturing…</>
                ) : saved ? (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Saved!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg> Save 3D Preview as PNG</>
                )}
              </button>
              <p className="text-white/20 text-[10px] text-center mt-2">
                Captures the current 3D view as a PNG image
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
