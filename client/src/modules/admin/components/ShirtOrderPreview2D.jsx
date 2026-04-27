import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { ShirtViewer2D } from '../../customize/components/ShirtViewer2D';
import { Spinner } from '../../../shared/components/Spinner';
import { nameToShapeKey } from '../../customize/utils/shirtTypes';

// ── Constants matching ShirtViewer2D exactly ──────────────────────────────────
const PRINT_AREA = {
  front: { x: 0.302, y: 0.390, w: 0.396, h: 0.330 },
  back:  { x: 0.302, y: 0.345, w: 0.396, h: 0.375 },
};
const BASE_SIZE = 86; // same as ShirtViewer2D
const VW = 300, VH = 400;

// ── Load an image cross-origin (returns HTMLImageElement) ─────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Fetch a URL as a Blob and trigger browser download ────────────────────────
async function blobDownload(url, filename) {
  const resp = await fetch(url, { mode: 'cors' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const blob = await resp.blob();
  const ext  = blob.type.split('/')[1]?.split(';')[0] || 'png';
  const bUrl = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = bUrl;
  a.download = filename.endsWith('.') ? filename + ext : filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(bUrl), 5000);
}

// ── Canvas composite: mockup + design → PNG Blob download ────────────────────
async function compositeDownload({ mockupUrl, designUrl, designTransform, side, filename }) {
  const CANVAS_W = 900, CANVAS_H = 1200;
  const sf = CANVAS_W / VW; // = 3

  // Load images concurrently
  const [mockupImg, designImg] = await Promise.all([
    mockupUrl  ? loadImage(mockupUrl)  : Promise.resolve(null),
    designUrl  ? loadImage(designUrl)  : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  // ─ 1. Background (white so the shirt outline is visible if mockup has transparency) ─
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ─ 2. Shirt mockup ────────────────────────────────────────────────────────
  if (mockupImg) {
    ctx.drawImage(mockupImg, 0, 0, CANVAS_W, CANVAS_H);
  }

  // ─ 3. User design, positioned & scaled exactly like ShirtViewer2D ─────────
  if (designImg) {
    const dt  = designTransform || { x: 0.5, y: 0.5, scale: 1.0, rotation: 0 };
    const PA  = PRINT_AREA[side];

    const pLeft   = PA.x * VW * sf;
    const pTop    = PA.y * VH * sf;
    const pW      = PA.w * VW * sf;
    const pH      = PA.h * VH * sf;

    const dSize   = BASE_SIZE * sf * (dt.scale  ?? 1.0);
    const aspect  = designImg.naturalHeight / designImg.naturalWidth || 1;
    const dH      = dSize * aspect;
    const dCX     = pLeft + (dt.x ?? 0.5) * pW;
    const dCY     = pTop  + (dt.y ?? 0.5) * pH;
    const rot     = (dt.rotation ?? 0) * Math.PI / 180;

    ctx.save();
    ctx.translate(dCX, dCY);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(designImg, -dSize / 2, -dH / 2, dSize, dH);
    ctx.restore();
  }

  // ─ 4. Download as PNG ─────────────────────────────────────────────────────
  await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
      const bUrl = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = bUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(bUrl), 5000);
      resolve();
    }, 'image/png');
  });
}

// ── Detail cell ───────────────────────────────────────────────────────────────
function DetailCell({ label, children }) {
  return (
    <div className="rounded-xl p-3 space-y-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-white/30 text-xs uppercase tracking-widest">{label}</p>
      <div className="text-white text-xs font-medium">{children}</div>
    </div>
  );
}

// ── Download button ───────────────────────────────────────────────────────────
function DlBtn({ label, icon, onClick, loading, disabled, accent }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 w-full"
      style={accent
        ? { background: 'rgba(107,66,38,0.22)', color: '#C9967A', border: '1px solid rgba(107,66,38,0.4)' }
        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }
      }>
      {loading ? <Spinner size="sm" className="text-current" /> : icon}
      {label}
    </button>
  );
}

// ── Single side viewer ────────────────────────────────────────────────────────
function SideViewer({ label, item, side, designUrl, designTransform, hasDesign, mockupUrl }) {
  const dt = designTransform || { x: 0.5, y: 0.5, scale: 1.0, rotation: 0 };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">{label}</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={hasDesign
            ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.07)' }
          }>
          {hasDesign ? '✓ Design' : 'Plain'}
        </span>
      </div>
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '3/4' }}>
        <ShirtViewer2D
          typeId={nameToShapeKey(item.shirtType || item.productName)}
          color={item.colorHex || '#FFFFFF'}
          side={side}
          designImage={designUrl || null}
          designX={dt.x}
          designY={dt.y}
          designScale={dt.scale}
          designRot={dt.rotation}
          onDesignMove={null}
          showPrintArea={false}
          mockupUrl={mockupUrl || null}
        />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ShirtOrderPreview2D({ order, item, onClose }) {
  const [activeTab,     setActiveTab]     = useState('preview');
  const [shirtConfig,   setShirtConfig]   = useState(null);
  const [downloading,   setDownloading]   = useState(null);

  // Fetch shirt config to get mockup URLs
  useEffect(() => {
    api.get('/shirt-config')
      .then(r => setShirtConfig(r.data.config))
      .catch(() => {});
  }, []);

  // Resolve mockup URLs from config
  const shirtTypeDoc = shirtConfig?.shirtTypes?.find(
    t => t._id === item.shirtTypeId
  );
  const mockupVariant = shirtTypeDoc?.mockups?.find(
    m => m.hex?.toLowerCase() === (item.colorHex || '').toLowerCase()
  );
  const frontMockupUrl = mockupVariant?.frontUrl || null;
  const backMockupUrl  = mockupVariant?.backUrl  || null;

  // Resolve design URLs (support old + new schema)
  const frontUrl = item.frontDesignUrl || item.designUrl || null;
  const frontDt  = item.frontDesignTransform || item.designTransform || null;
  const backUrl  = item.backDesignUrl  || null;
  const backDt   = item.backDesignTransform  || null;
  const hasFront = !!frontUrl;
  const hasBack  = !!backUrl;

  // Naming helper
  const safeName = (s) => s.replace(/[^a-z0-9_\-]/gi, '-');
  const customer = safeName(
    `${order.user?.firstName || ''}-${order.user?.lastName || ''}`.trim() || 'customer'
  );
  const base = `${order.orderNumber}-${customer}`;

  // ── Download: design only (raw file) ──────────────────────────────────────
  const downloadDesignOnly = useCallback(async (url, side) => {
    if (!url) return;
    const key = `${side}-design`;
    setDownloading(key);
    try {
      const ext = url.split('.').pop()?.split('?')[0] || 'png';
      await blobDownload(url, `${base}-${side}-design.${ext}`);
      toast.success(`${side} design downloaded.`);
    } catch {
      toast.error('Download failed — check your connection.');
    } finally { setDownloading(null); }
  }, [base]);

  // ── Download: composite (mockup + design via canvas) ──────────────────────
  const downloadComposite = useCallback(async (side) => {
    const mockupUrl   = side === 'front' ? frontMockupUrl : backMockupUrl;
    const designUrl   = side === 'front' ? frontUrl       : backUrl;
    const designTform = side === 'front' ? frontDt        : backDt;

    if (!designUrl) { toast.error('No design on this side.'); return; }

    const key = `${side}-composite`;
    setDownloading(key);
    try {
      await compositeDownload({
        mockupUrl,
        designUrl,
        designTransform: designTform,
        side,
        filename: `${base}-${side}-with-shirt.png`,
      });
      toast.success(`${side} composite downloaded.`);
    } catch (e) {
      console.error(e);
      toast.error('Composite failed — trying design only…');
      // Fallback: just download the design
      if (designUrl) {
        try {
          await blobDownload(designUrl, `${base}-${side}-design.png`);
        } catch { toast.error('Download failed.'); }
      }
    } finally { setDownloading(null); }
  }, [frontMockupUrl, backMockupUrl, frontUrl, backUrl, frontDt, backDt, base]);

  const DownloadIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
  const MergeIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  );

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
        className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.10)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 z-10"
          style={{ background: '#111' }}>
          <div>
            <p className="text-xs tracking-widest uppercase text-[#8B5A3C] mb-0.5">Order Preview</p>
            <h3 className="font-display text-lg font-bold text-white">{order.orderNumber}</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {order.user?.firstName} {order.user?.lastName}
              {' · '}{item.shirtType || item.productName}{' · '}{item.color}{' · '}{item.size}{' · '}×{item.quantity}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[{ id: 'preview', label: 'Preview' }, { id: 'details', label: 'Details' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeTab === t.id
                    ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.4)' }
                  }>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── PREVIEW TAB ─────────────────────────────────────────────── */}
            {activeTab === 'preview' && (
              <motion.div key="preview"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6">

                {/* Mockup status banner */}
                {(frontMockupUrl || backMockupUrl) ? (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                    <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-emerald-400/80 text-xs">
                      Showing real shirt mockup with customer's design overlaid.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-amber-400/75 text-xs">
                      No mockup image configured for this shirt type / colour — showing fallback 2D render.
                      Upload mockup images in <strong>Shirt Config</strong>.
                    </p>
                  </div>
                )}

                {/* Front + Back viewers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SideViewer label="Front Side" item={item} side="front"
                    designUrl={frontUrl} designTransform={frontDt} hasDesign={hasFront}
                    mockupUrl={frontMockupUrl} />
                  <SideViewer label="Back Side"  item={item} side="back"
                    designUrl={backUrl}  designTransform={backDt}  hasDesign={hasBack}
                    mockupUrl={backMockupUrl} />
                </div>

                {/* ── Download section ─────────────────────────────────────── */}
                {(hasFront || hasBack) && (
                  <div className="rounded-2xl p-5 space-y-4"
                    style={{ background: 'rgba(107,66,38,0.06)', border: '1px solid rgba(107,66,38,0.2)' }}>

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      <p className="text-sm font-semibold text-white">Download Files</p>
                    </div>

                    <div className="text-xs text-white/35 -mt-2 leading-relaxed">
                      <strong className="text-white/55">Design only</strong> — just the customer's artwork file.<br/>
                      <strong className="text-white/55">With shirt mockup</strong> — design composited onto the shirt image, ready to send to print.
                    </div>

                    {/* Front downloads */}
                    {hasFront && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>Front Side</p>
                        <div className="grid grid-cols-2 gap-2">
                          <DlBtn
                            label="Design Only"
                            icon={<DownloadIcon />}
                            loading={downloading === 'front-design'}
                            disabled={!!downloading}
                            onClick={() => downloadDesignOnly(frontUrl, 'front')}
                          />
                          <DlBtn
                            label="With Shirt Mockup"
                            icon={<MergeIcon />}
                            accent
                            loading={downloading === 'front-composite'}
                            disabled={!!downloading}
                            onClick={() => downloadComposite('front')}
                          />
                        </div>
                        {!frontMockupUrl && (
                          <p className="text-amber-400/50 text-[10px]">
                            No shirt mockup — composite will use white background only.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Back downloads */}
                    {hasBack && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>Back Side</p>
                        <div className="grid grid-cols-2 gap-2">
                          <DlBtn
                            label="Design Only"
                            icon={<DownloadIcon />}
                            loading={downloading === 'back-design'}
                            disabled={!!downloading}
                            onClick={() => downloadDesignOnly(backUrl, 'back')}
                          />
                          <DlBtn
                            label="With Shirt Mockup"
                            icon={<MergeIcon />}
                            accent
                            loading={downloading === 'back-composite'}
                            disabled={!!downloading}
                            onClick={() => downloadComposite('back')}
                          />
                        </div>
                        {!backMockupUrl && (
                          <p className="text-amber-400/50 text-[10px]">
                            No back mockup — composite will use white background only.
                          </p>
                        )}
                      </div>
                    )}

                    {/* File naming note */}
                    <p className="text-white/20 text-[10px] pt-1 border-t border-white/[0.06]">
                      Files saved as: <span className="font-mono">{base}-front-design.png</span> / <span className="font-mono">{base}-front-with-shirt.png</span>
                    </p>
                  </div>
                )}

                {/* Design thumbnails + position data */}
                {(hasFront || hasBack) && (
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs font-semibold tracking-widest uppercase text-white/30">Design Files</p>
                    <div className="flex flex-wrap gap-5">
                      {hasFront && (
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={frontUrl} alt="Front design" className="w-20 h-20 object-contain p-2" />
                          </div>
                          <div>
                            <p className="text-white/55 text-xs font-semibold mb-1">FRONT</p>
                            {frontDt && (
                              <div className="text-[10px] space-y-0.5 text-white/30 font-mono">
                                <p>X {(frontDt.x*100).toFixed(0)}%  Y {(frontDt.y*100).toFixed(0)}%</p>
                                <p>Scale {frontDt.scale?.toFixed(2)}×  Rot {frontDt.rotation?.toFixed(0)}°</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {hasBack && (
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={backUrl} alt="Back design" className="w-20 h-20 object-contain p-2" />
                          </div>
                          <div>
                            <p className="text-white/55 text-xs font-semibold mb-1">BACK</p>
                            {backDt && (
                              <div className="text-[10px] space-y-0.5 text-white/30 font-mono">
                                <p>X {(backDt.x*100).toFixed(0)}%  Y {(backDt.y*100).toFixed(0)}%</p>
                                <p>Scale {backDt.scale?.toFixed(2)}×  Rot {backDt.rotation?.toFixed(0)}°</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {item.designNote && (
                  <div className="rounded-xl p-4"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="text-blue-400/70 text-xs font-semibold mb-1.5">Customer Print Instructions</p>
                    <p className="text-white/65 text-sm italic">"{item.designNote}"</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── DETAILS TAB ─────────────────────────────────────────────── */}
            {activeTab === 'details' && (
              <motion.div key="details"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Shirt Specifications</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DetailCell label="Style">
                      {item.shirtType || item.productName}
                    </DetailCell>
                    <DetailCell label="Color">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                          style={{ background: item.colorHex || '#fff' }} />
                        {item.color}
                      </div>
                    </DetailCell>
                    <DetailCell label="Size & Qty">{item.size} × {item.quantity}</DetailCell>
                    <DetailCell label="Total">PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}</DetailCell>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Print Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[['front','Front Side', frontUrl, frontDt, hasFront],
                      ['back', 'Back Side',  backUrl,  backDt,  hasBack]].map(([side, label, dUrl, dt, has]) => (
                      <div key={side} className="rounded-xl p-4 space-y-2"
                        style={{
                          background: has ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                          border:     has ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                        <div className="flex items-center justify-between">
                          <p className="text-white/60 text-xs font-semibold">{label}</p>
                          <span className={`text-[10px] font-semibold ${has ? 'text-emerald-400' : 'text-white/25'}`}>
                            {has ? 'Has Design' : 'Plain'}
                          </span>
                        </div>
                        {has && dt && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {[['X', (dt.x*100).toFixed(0)+'%'], ['Y', (dt.y*100).toFixed(0)+'%'],
                              ['Scale', dt.scale?.toFixed(2)+'×'], ['Rotation', dt.rotation?.toFixed(0)+'°']].map(([k,v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-white/35">{k}</span>
                                <span className="text-white font-mono">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!has && <p className="text-white/20 text-xs">No design on this side</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Order Information</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <DetailCell label="Order #">{order.orderNumber}</DetailCell>
                    <DetailCell label="Customer">
                      {order.user?.firstName} {order.user?.lastName}
                      <p className="text-white/30 text-[10px] mt-0.5">{order.user?.email}</p>
                    </DetailCell>
                    <DetailCell label="Status">
                      <span className="capitalize">{order.status}</span>
                      {order.isReversed && <p className="text-red-400/60 text-[10px] mt-0.5">Reversed</p>}
                    </DetailCell>
                    <DetailCell label="Payment">
                      <span className="capitalize">{order.paymentMethod}</span>
                      <p className={`text-[10px] mt-0.5 ${order.paymentStatus==='paid'?'text-emerald-400':'text-yellow-400'}`}>
                        {order.paymentStatus}
                      </p>
                    </DetailCell>
                    <DetailCell label="Date">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <p className="text-white/25 text-[10px] mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </DetailCell>
                    <DetailCell label="Total">PKR {Math.round(order.total).toLocaleString()}</DetailCell>
                  </div>
                </div>

                {order.shippingAddress && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Delivery Address</p>
                    <div className="rounded-xl p-4 space-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-white text-sm font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p className="text-white/55 text-xs">{order.shippingAddress.street}</p>
                      <p className="text-white/55 text-xs">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                      <p className="text-white/55 text-xs">{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && <p className="text-white/40 text-xs mt-1">{order.shippingAddress.phone}</p>}
                    </div>
                  </div>
                )}

                {item.designNote && (
                  <div className="rounded-xl p-4"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="text-blue-400/70 text-xs font-semibold mb-1.5">Print Instructions</p>
                    <p className="text-white/65 text-sm italic">"{item.designNote}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
