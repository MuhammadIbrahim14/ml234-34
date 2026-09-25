import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../router';
import { isValidRole } from '../lib/supabase';

/**
 * Lightweight role guard for dashboard routes.
 * Visitors stay on public pages; authenticated users must match role (admin can open any).
 */
export default function RoleGuard({ role, children }) {
  const { loading, isAuthenticated, canAccessDashboard, dashboardPath } = useAuth();
  const allowed = isAuthenticated && isValidRole(role) && canAccessDashboard(role);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isValidRole(role) || !canAccessDashboard(role)) {
      navigate(dashboardPath);
    }
  }, [loading, isAuthenticated, role, canAccessDashboard, dashboardPath]);

  if (loading) {
    return (
      <div className="ml auth-page" style={{ placeItems: 'center', display: 'grid', minHeight: '100vh' }}>
        <p className="muted">Checking your MarketLink session…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="ml auth-page" style={{ placeItems: 'center', display: 'grid', minHeight: '100vh' }}>
        <p className="muted">Redirecting…</p>
      </div>
    );
  }

  return children;
}
