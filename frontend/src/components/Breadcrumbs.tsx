import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Auto-generates a breadcrumb trail from the current URL.
 * Supports dynamic segments like :projectId → shows "Project #id"
 */
export default function Breadcrumbs() {
  const location = useLocation();

  const crumbs = useMemo(() => {
    const parts = location.pathname
      .replace(/^\/dashboard\/?/, '') // strip /dashboard prefix
      .split('/')
      .filter(Boolean);

    if (parts.length === 0) return [];

    const result: { label: string; path: string }[] = [];
    let accumulated = '/dashboard';

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      accumulated += `/${segment}s`;

      // Humanize the segment
      let label = segment;
      const prevSegment = parts[i - 1];

      if (/^\d+$/.test(segment)) {
        // Numeric ID — contextual label
        if (prevSegment === 'projects') label = `Project #${segment}`;
        else if (prevSegment === 'tasks') label = `Task #${segment}`;
        else if (prevSegment === 'timesheets') label = `Timesheet #${segment}`;
        else if (prevSegment === 'users') label = `User #${segment}`;
        else label = `#${segment}`;
      } else {
        // Capitalize and clean
        label = segment
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      result.push({ label, path: accumulated });
    }

    return result;
  }, [location.pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors"
      >
        <Home size={14} />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={crumb.path} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-300" />
            {isLast ? (
              <span className="font-semibold text-gray-800">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
