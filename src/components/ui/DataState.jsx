import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Inbox, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { DEMO_CRUD_MSG } from '../../lib/api/errors';

export function LoadingBlock({ label }) {
  const { t } = useTranslation();
  return (
    <div className="empty-note" role="status">
      <Loader2 size={22} className="spin-slow" />
      <div>
        <b>{label || t('common.loading')}</b>
        <p>{t('common.pleaseWait')}</p>
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <div className="empty-note" role="alert" style={{ borderColor: 'var(--primary)' }}>
      <AlertCircle size={22} />
      <div>
        <b>{t('common.errorTitle')}</b>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="btn sm" onClick={onRetry} style={{ marginTop: 8 }}>
            {t('common.tryAgain')}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  const { t } = useTranslation();
  return (
    <div className="empty-note">
      <Inbox size={22} />
      <div>
        <b>{title || t('common.emptyTitle')}</b>
        <p>{message || t('common.emptyMessage')}</p>
        {action}
      </div>
    </div>
  );
}

export function DemoModeNotice() {
  const { t } = useTranslation();
  if (isSupabaseConfigured) return null;
  return (
    <div className="empty-note" role="status">
      <AlertCircle size={22} />
      <div>
        <b>{t('common.demoTitle')}</b>
        <p>{DEMO_CRUD_MSG}</p>
      </div>
    </div>
  );
}

export function ConfirmDelete({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  busy,
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="dash-panel" style={{ marginTop: 12 }}>
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('common.confirm')}</span>
          <h3>{title || t('common.delete')}</h3>
        </div>
      </div>
      <p className="muted">{message || t('common.emptyMessage')}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn" disabled={busy} onClick={onConfirm}>
          {busy ? t('common.deleting') : t('common.delete')}
        </button>
        <button type="button" className="btn ghost" disabled={busy} onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

export function SuccessNote({ message }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <div className="empty-note" role="status">
      <CheckCircle2 size={22} />
      <div>
        <b>{t('common.saved')}</b>
        <p>{message}</p>
      </div>
    </div>
  );
}
