import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from './Spinner';

const MAX_MB   = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({
  onUpload,          // async fn(file) => { url, publicId }
  currentUrl = null, // existing image URL to show
  label      = 'Upload Image',
  hint       = 'JPG, PNG or WEBP · Max 5 MB',
  aspectClass = 'aspect-video', // tailwind aspect ratio class
}) {
  const [preview,  setPreview]  = useState(currentUrl);
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const validate = (file) => {
    if (!ACCEPTED.includes(file.type)) return 'Only JPG, PNG, or WEBP allowed.';
    if (file.size > MAX_MB * 1024 * 1024) return `Max file size is ${MAX_MB} MB.`;
    return null;
  };

  const process = async (file) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError('');
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setProgress(0);
    try {
      const result = await onUpload(file, (p) => setProgress(p));
      setPreview(result.url);
    } catch (e) {
      setError(e?.response?.data?.message || 'Upload failed. Please try again.');
      setPreview(currentUrl);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) process(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="w-full">
      {label && <label className="label mb-2">{label}</label>}

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full ${aspectClass} rounded-xl overflow-hidden cursor-pointer transition-all duration-200`}
        style={{
          border: `1.5px dashed ${dragging ? 'rgba(107,66,38,0.7)' : 'rgba(255,255,255,0.12)'}`,
          background: dragging ? 'rgba(107,66,38,0.08)' : 'rgba(255,255,255,0.03)',
        }}
      >
        {/* Preview image */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay when no image or hovering */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
            preview ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}
          style={{ background: preview ? 'rgba(11,11,11,0.6)' : 'transparent', backdropFilter: preview ? 'blur(4px)' : 'none' }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="md" className="text-ink-brown" />
              <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#6B4226,#8B5A3C)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="text-xs text-white/50">{progress}%</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(107,66,38,0.2)', border: '1px solid rgba(107,66,38,0.3)' }}>
                <svg className="w-5 h-5 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-white/60 text-xs font-medium">{preview ? 'Click to replace' : 'Click or drag to upload'}</p>
              <p className="text-white/25 text-xs">{hint}</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="error-text mt-2"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
