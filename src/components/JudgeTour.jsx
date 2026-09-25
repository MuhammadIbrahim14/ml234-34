import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { navigate } from '../router';

const TOUR_DONE_KEY = 'ml-judge-tour-done';

const STEPS = [
  { id: 'map', path: '/#explore-map' },
  { id: 'about', path: '/about#about-story' },
  { id: 'roles', path: '/#role-pitch' },
  { id: 'lang', path: '/' },
  { id: 'done', path: '/markets' },
];

/**
 * Floating judge walkthrough for public / visitor routes only.
 * Navigates between pitch surfaces; does not seed passwords or mutate roles.
 */
export default function JudgeTour() {
  const { t } = useTranslation();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const target = STEPS[step];
    if (!target?.path) return;
    navigate(target.path);
    const hash = target.path.includes('#') ? target.path.split('#')[1] : null;
    if (!hash) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
    return () => clearTimeout(timer);
  }, [open, step]);

  const goNext = () => {
    if (step >= STEPS.length - 1) {
      try {
        localStorage.setItem(TOUR_DONE_KEY, '1');
      } catch {
        /* ignore */
      }
      setOpen(false);
      setStep(0);
      navigate('/markets');
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step <= 0) return;
    setStep((s) => s - 1);
  };

  const dismiss = () => {
    setOpen(false);
  };

  const start = () => {
    setStep(0);
    setOpen(true);
  };

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="ml-judge-tour" data-open={open ? '1' : '0'}>
      {open && (
        <div className="ml-judge-panel" id={panelId} role="dialog" aria-label={t('tour.panelAria')}>
          <header className="ml-judge-head">
            <div>
              <b>{t('tour.title')}</b>
              <small>
                {t('tour.stepOf', { current: step + 1, total: STEPS.length })}
              </small>
            </div>
            <button type="button" className="ml-judge-iconbtn" aria-label={t('tour.closeAria')} onClick={dismiss}>
              <X size={18} />
            </button>
          </header>
          <div className="ml-judge-body">
            <h3>{t(`tour.steps.${current.id}.title`)}</h3>
            <p>{t(`tour.steps.${current.id}.body`)}</p>
          </div>
          <div className="ml-judge-actions">
            <button type="button" className="btn sm ghost" onClick={goBack} disabled={step === 0}>
              <ChevronLeft size={14} /> {t('tour.back')}
            </button>
            <button type="button" className="btn sm" onClick={goNext}>
              {isLast ? t('tour.finish') : t('tour.next')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ml-judge-fab"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('tour.closeAria') : t('tour.openAria')}
        onClick={() => (open ? dismiss() : start())}
      >
        {open ? <X size={22} /> : <Compass size={22} />}
      </button>
    </div>
  );
}
