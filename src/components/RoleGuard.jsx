import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../router';
import { hasDashboard } from '../lib/supabase';

/**
 * Lightweight role guard for dashboard routes (farmer / admin / manager only).
 * Customers are sent to the public site — they shop there, not via a dashboard.
 */
export default function RoleGuard({ role, children }) {
  const { t } = useTranslation();
  const { loading, isAuthenticated, canAccessDashboard, dashboardPath } = useAuth();
  const allowed = isAuthenticated && hasDashboard(role) && canAccessDashboard(role);

  useEffect(() => {
    if (loading) return;
    if (!hasDashboard(role)) {
      navigate('/');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canAccessDashboard(role)) {
      navigate(dashboardPath.startsWith('/dashboard') ? dashboardPath : '/');
    }
  }, [loading, isAuthenticated, role, canAccessDashboard, dashboardPath]);

  if (loading) {
    return (
      <div className="ml auth-page" style={{ placeItems: 'center', display: 'grid', minHeight: '100vh' }}>
        <p className="muted">{t('auth.checkingSession')}</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="ml auth-page" style={{ placeItems: 'center', display: 'grid', minHeight: '100vh' }}>
        <p className="muted">{t('auth.redirecting')}</p>
      </div>
    );
  }

  return children;
}
