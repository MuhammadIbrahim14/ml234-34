import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutList, LayoutGrid } from 'lucide-react';

const MQ = '(min-width: 861px)';

/**
 * Desktop: list | grid (persisted). Mobile: always stacked containers (toolbar hidden).
 */
export function useDataViewMode(storageKey = 'default') {
  const key = `ml-dataview:${storageKey}`;
  const [mode, setModeState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === 'grid' || v === 'list' ? v : 'list';
    } catch {
      return 'list';
    }
  });
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MQ).matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function setMode(next) {
    const v = next === 'grid' ? 'grid' : 'list';
    setModeState(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      /* ignore */
    }
  }

  return { mode, setMode, isDesktop, effectiveMode: isDesktop ? mode : 'list' };
}

export function DataViewToolbar({ mode, onChange, className = '' }) {
  const { t } = useTranslation();
  return (
    <div className={`data-view-toolbar ${className}`.trim()} role="group" aria-label={t('view.toggle')}>
      <button
        type="button"
        className={mode === 'list' ? 'on' : ''}
        onClick={() => onChange('list')}
        aria-pressed={mode === 'list'}
        title={t('view.list')}
      >
        <LayoutList size={15} />
        <span>{t('view.list')}</span>
      </button>
      <button
        type="button"
        className={mode === 'grid' ? 'on' : ''}
        onClick={() => onChange('grid')}
        aria-pressed={mode === 'grid'}
        title={t('view.grid')}
      >
        <LayoutGrid size={15} />
        <span>{t('view.grid')}</span>
      </button>
    </div>
  );
}

export function DataView({ mode = 'list', children, className = '' }) {
  return (
    <div className={`data-view data-view--${mode === 'grid' ? 'grid' : 'list'} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * Container card for one record — replaces mini-table rows.
 * details: [{ label, value }] — only rows with value render
 */
export function DataCard({
  title,
  subtitle,
  status,
  statusClass = 's1',
  details = [],
  actions,
  children,
  className = '',
}) {
  const rows = (details || []).filter((d) => d && d.value != null && String(d.value).trim() !== '');
  return (
    <article className={`data-card ${className}`.trim()}>
      <header className="data-card-head">
        <div className="data-card-titles">
          <h4>{title}</h4>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {status != null && status !== '' ? (
          <span className={`status ${statusClass}`}>{status}</span>
        ) : null}
      </header>
      {rows.length > 0 && (
        <dl className="data-card-details">
          {rows.map((d) => (
            <div key={d.label} className="data-card-row">
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
      {actions ? <footer className="data-card-actions">{actions}</footer> : null}
    </article>
  );
}
