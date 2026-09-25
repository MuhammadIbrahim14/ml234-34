import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '../../lib/cloudinary';

/**
 * Choose image → upload to Cloudinary → parent receives secure URL for DB.
 */
export default function ImageUploadField({
  label,
  value = '',
  onChange,
  disabled = false,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const displayLabel = label ?? t('upload.label');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    const result = await uploadImageToCloudinary(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || t('upload.failed'));
      return;
    }
    onChange?.(result.url);
  }

  function clear() {
    setError('');
    onChange?.('');
  }

  return (
    <div className="image-upload-field" style={{ gridColumn: '1 / -1' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{displayLabel}</span>
      {!isCloudinaryConfigured() && (
        <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
          {t('upload.envWarning')}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--soft)',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {value ? (
            <img src={value} alt={t('upload.preview')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImagePlus size={28} style={{ opacity: 0.45 }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
            disabled={disabled || busy || !isCloudinaryConfigured()}
          />
          <button
            type="button"
            className="btn sm"
            disabled={disabled || busy || !isCloudinaryConfigured()}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 size={15} className="spin" /> : <ImagePlus size={15} />}
            {busy ? ` ${t('upload.uploading')}` : ` ${t('upload.choose')}`}
          </button>
          {value && (
            <button type="button" className="btn ghost sm" disabled={disabled || busy} onClick={clear}>
              <X size={14} /> {t('upload.remove')}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" style={{ color: '#b42318', fontSize: 12, margin: '8px 0 0' }}>
          {error}
        </p>
      )}
      {value && (
        <p className="muted" style={{ fontSize: 11, margin: '8px 0 0', wordBreak: 'break-all' }}>
          Saved URL: {value}
        </p>
      )}
    </div>
  );
}
