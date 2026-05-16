import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Users,
  LineChart,
  ShieldCheck,
  Zap,
  MessageSquare,
} from 'lucide-react';

export default function HomePage(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen font-inter page-enter">
      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light opacity-50 animate-blob"></div>
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light opacity-50 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-8 animate-slide-in-up">
            <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
            ProjectFlow is now live
          </div>

          <h1
            className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight mb-8 leading-tight animate-slide-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Manage work.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              Deliver faster.
            </span>
          </h1>

          <p
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-in-up"
            style={{ animationDelay: '200ms' }}
          >
            The most intuitive project management platform built for modern
            teams. Plan, track, and collaborate without the clutter.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-white bg-primary-600 hover:bg-primary-700 font-bold text-lg shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              Start for free
              <ArrowRight
                className="group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 hover:bg-surface-50 dark:hover:bg-slate-800 font-bold text-lg shadow-sm transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 bg-surface-50 dark:bg-slate-950/50 border-y border-surface-200 dark:border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features disguised in a simple, beautiful interface.
              Focus on your work, not on learning the tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: 'Intuitive Dashboard',
                desc: "Get a bird's-eye view of all your projects and tasks in one place.",
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Work together seamlessly with built-in comments and assignments.',
              },
              {
                icon: LineChart,
                title: 'Advanced Tracking',
                desc: 'Track timesheets, budgets, and project phases with precision.',
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                desc: 'Built for speed. Navigate between projects instantly.',
              },
              {
                icon: ShieldCheck,
                title: 'Enterprise Security',
                desc: 'Your data is safe with role-based access control and encryption.',
              },
              {
                icon: MessageSquare,
                title: 'Contextual Discussions',
                desc: 'Keep conversations where they belong—attached to projects and tasks.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="card p-8 group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start for free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="card p-8 border border-surface-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Starter
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Perfect for individuals and small teams.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Up to 5 Users',
                  '3 Active Projects',
                  'Basic Task Management',
                  'Community Support',
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-primary-500 flex-shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="w-full py-3 px-4 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200 bg-surface-100 dark:bg-slate-800 hover:bg-surface-200 dark:hover:bg-slate-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="card p-8 border-2 border-primary-500 flex flex-col relative overflow-hidden shadow-float transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Professional
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                For growing teams that need more power.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  $12
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  /user/mo
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unlimited Users',
                  'Unlimited Projects',
                  'Timesheet Tracking',
                  'Advanced Reporting',
                  'Priority Support',
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-300"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-primary-500 flex-shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="w-full py-3 px-4 rounded-xl text-center font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="card p-8 border border-surface-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Enterprise
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Custom solutions for large organizations.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  Custom
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Pro',
                  'Custom Integrations',
                  'Dedicated Success Manager',
                  'SSO & SAML',
                  '99.99% Uptime SLA',
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-gray-400 dark:text-gray-600 flex-shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="w-full py-3 px-4 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200 bg-surface-100 dark:bg-slate-800 hover:bg-surface-200 dark:hover:bg-slate-700 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Ready to transform how you work?
          </h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of teams who are already using ProjectFlow to deliver
            better work, faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-primary-700 bg-white font-bold text-lg shadow-lg hover:scale-105 transition-transform"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
