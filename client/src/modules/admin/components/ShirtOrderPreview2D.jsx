import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShirtViewer2D } from '../../customize/components/ShirtViewer2D';
import { Spinner } from '../../../shared/components/Spinner';

// ─── Stat cell for order details panel ───────────────────────────────────────
function DetailCell({ label, children }) {
  return (
    <div className="rounded-xl p-3 space-y-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-white/30 text-xs uppercase tracking-widest">{label}</p>
      <div className="text-white text-xs font-medium">{children}</div>
    </div>
  );
}

// ─── Single side preview card ─────────────────────────────────────────────────
function SidePreview({ label, item, side, designUrl, designTransform, hasDesign }) {
  const dt = designTransform || { x: 0.5, y: 0.5, scale: 1.0, rotation: 0 };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">{label}</p>
        {hasDesign ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
            Design
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Plain
          </span>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', aspectRatio: '3/4' }}>
        <ShirtViewer2D
          typeId={item.shirtTypeId || 'plain-tshirt'}
          color={item.colorHex || '#FFFFFF'}
          side={side}
          designImage={designUrl || null}
          designX={dt.x}
          designY={dt.y}
          designScale={dt.scale}
          designRot={dt.rotation}
          onDesignMove={null}
          showPrintArea={false}
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ShirtOrderPreview2D({ order, item, onClose }) {
  const [activeTab, setActiveTab] = useState('preview');

  // Resolve front / back design data (support both old and new schema)
  const frontUrl = item.frontDesignUrl || item.designUrl || null;
  const frontDt  = item.frontDesignTransform || item.designTransform || null;
  const backUrl  = item.backDesignUrl  || null;
  const backDt   = item.backDesignTransform  || null;

  const hasFront = !!frontUrl;
  const hasBack  = !!backUrl;

  const handleDownload = (url, side) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${order.orderNumber}-${side}-design.png`;
    link.target   = '_blank';
    link.rel      = 'noopener noreferrer';
    link.click();
  };

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
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 z-10"
          style={{ background: '#111' }}>
          <div>
            <p className="text-xs tracking-widest uppercase text-[#8B5A3C] mb-0.5">Design Preview</p>
            <h3 className="font-display text-lg font-bold text-white">{order.orderNumber}</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {order.user?.firstName} {order.user?.lastName}
              {' · '}{item.color} · {item.size} · ×{item.quantity}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 p-1 rounded-xl mr-2"
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

            {/* ── Preview tab ─────────────────────────────────────── */}
            {activeTab === 'preview' && (
              <motion.div key="preview"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6">

                {/* Shirt previews — side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SidePreview
                    label="Front Side"
                    item={item}
                    side="front"
                    designUrl={frontUrl}
                    designTransform={frontDt}
                    hasDesign={hasFront}
                  />
                  <SidePreview
                    label="Back Side"
                    item={item}
                    side="back"
                    designUrl={backUrl}
                    designTransform={backDt}
                    hasDesign={hasBack}
                  />
                </div>

                {/* Download buttons */}
                {(hasFront || hasBack) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hasFront && (
                      <button
                        onClick={() => handleDownload(frontUrl, 'front')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.28)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Front Design
                      </button>
                    )}
                    {hasBack && (
                      <button
                        onClick={() => handleDownload(backUrl, 'back')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.28)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Back Design
                      </button>
                    )}
                    {!hasBack && hasFront && <div />}
                  </div>
                )}

                {/* Design thumbnails */}
                {(hasFront || hasBack) && (
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(107,66,38,0.18)' }}>
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#8B5A3C]">Design Files</p>
                    <div className="flex flex-wrap gap-4">
                      {hasFront && (
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={frontUrl} alt="Front design"
                              className="w-20 h-20 object-contain p-2" />
                          </div>
                          <div>
                            <p className="text-white/50 text-xs mb-1">Front</p>
                            {frontDt && (
                              <div className="text-[10px] space-y-0.5 text-white/30 font-mono">
                                <p>X: {(frontDt.x * 100).toFixed(0)}%  Y: {(frontDt.y * 100).toFixed(0)}%</p>
                                <p>Scale: {frontDt.scale?.toFixed(2)}×  Rot: {frontDt.rotation?.toFixed(0)}°</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {hasBack && (
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={backUrl} alt="Back design"
                              className="w-20 h-20 object-contain p-2" />
                          </div>
                          <div>
                            <p className="text-white/50 text-xs mb-1">Back</p>
                            {backDt && (
                              <div className="text-[10px] space-y-0.5 text-white/30 font-mono">
                                <p>X: {(backDt.x * 100).toFixed(0)}%  Y: {(backDt.y * 100).toFixed(0)}%</p>
                                <p>Scale: {backDt.scale?.toFixed(2)}×  Rot: {backDt.rotation?.toFixed(0)}°</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer note */}
                {item.designNote && (
                  <div className="rounded-xl p-4"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="text-blue-400/70 text-xs font-semibold mb-1.5">Customer Note</p>
                    <p className="text-white/65 text-sm italic">"{item.designNote}"</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Details tab ─────────────────────────────────────── */}
            {activeTab === 'details' && (
              <motion.div key="details"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Shirt specs */}
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Shirt Specifications</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DetailCell label="Style">
                      {item.shirtType || item.productName}
                      {item.shirtTypeId && <p className="text-white/20 font-mono text-[9px] mt-0.5">{item.shirtTypeId}</p>}
                    </DetailCell>
                    <DetailCell label="Color">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                          style={{ background: item.colorHex || '#fff' }} />
                        {item.color}
                      </div>
                    </DetailCell>
                    <DetailCell label="Size & Qty">
                      {item.size} × {item.quantity}
                    </DetailCell>
                    <DetailCell label="Total">
                      PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                    </DetailCell>
                  </div>
                </div>

                {/* Print details */}
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Print Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front design details */}
                    <div className="rounded-xl p-4 space-y-2"
                      style={{
                        background: hasFront ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                        border: hasFront ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-xs font-semibold">Front Side</p>
                        {hasFront
                          ? <span className="text-[10px] text-emerald-400 font-semibold">Has Design</span>
                          : <span className="text-[10px] text-white/25">Plain</span>}
                      </div>
                      {hasFront && frontDt && (
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-white/35">X</span>
                            <span className="text-white font-mono">{(frontDt.x * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Y</span>
                            <span className="text-white font-mono">{(frontDt.y * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Scale</span>
                            <span className="text-white font-mono">{frontDt.scale?.toFixed(2)}×</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Rotation</span>
                            <span className="text-white font-mono">{frontDt.rotation?.toFixed(0)}°</span>
                          </div>
                        </div>
                      )}
                      {!hasFront && <p className="text-white/20 text-xs">No design on front side</p>}
                    </div>

                    {/* Back design details */}
                    <div className="rounded-xl p-4 space-y-2"
                      style={{
                        background: hasBack ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                        border: hasBack ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-xs font-semibold">Back Side</p>
                        {hasBack
                          ? <span className="text-[10px] text-emerald-400 font-semibold">Has Design</span>
                          : <span className="text-[10px] text-white/25">Plain</span>}
                      </div>
                      {hasBack && backDt && (
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-white/35">X</span>
                            <span className="text-white font-mono">{(backDt.x * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Y</span>
                            <span className="text-white font-mono">{(backDt.y * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Scale</span>
                            <span className="text-white font-mono">{backDt.scale?.toFixed(2)}×</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/35">Rotation</span>
                            <span className="text-white font-mono">{backDt.rotation?.toFixed(0)}°</span>
                          </div>
                        </div>
                      )}
                      {!hasBack && <p className="text-white/20 text-xs">No design on back side</p>}
                    </div>
                  </div>
                </div>

                {/* Order info */}
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
                      <p className={`text-[10px] mt-0.5 ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {order.paymentStatus}
                      </p>
                    </DetailCell>
                    <DetailCell label="Date">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <p className="text-white/25 text-[10px] mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </DetailCell>
                    <DetailCell label="Order Total">
                      PKR {Math.round(order.total).toLocaleString()}
                    </DetailCell>
                  </div>
                </div>

                {/* Shipping address */}
                {order.shippingAddress && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Delivery Address</p>
                    <div className="rounded-xl p-4 space-y-1"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-white text-sm font-medium">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p className="text-white/55 text-xs">{order.shippingAddress.street}</p>
                      <p className="text-white/55 text-xs">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-white/55 text-xs">{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <p className="text-white/40 text-xs mt-1">{order.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer note */}
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
