import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { apiClient } from '../lib/apiClient';
import { Check, Zap, Star, Shield, HelpCircle, Loader2 } from 'lucide-react';
import Logger from '../lib/logger';

interface PricingTier {
  id: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  limits: {
    projects: string;
    members: string;
    storage: string;
  };
  buttonText: string;
  popular?: boolean;
}

export default function PricingPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const tiers: PricingTier[] = [
    {
      id: 'FREE',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small teams and personal projects.',
      icon: <Shield className="w-6 h-6 text-gray-400" />,
      features: [
        'Standard Kanban Boards',
        'Basic Task Management',
        'Time Tracking Widget',
        'Direct Chat Messages',
        'Email Support',
      ],
      limits: {
        projects: 'Up to 3 Projects',
        members: 'Up to 5 Workspace Members',
        storage: '5 GB Storage',
      },
      buttonText: 'Current Plan',
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '$15',
      period: 'per month',
      description: 'Unleash full efficiency and unlimited collaboration.',
      icon: <Zap className="w-6 h-6 text-indigo-500" />,
      features: [
        'Everything in Free',
        'Advanced Analytics Charts',
        'Gantt Timelines',
        'Calendar Schedulers',
        'Priority Slack Support',
      ],
      limits: {
        projects: 'Up to 20 Projects',
        members: 'Up to 15 Members',
        storage: '50 GB Storage',
      },
      buttonText: 'Upgrade to Pro',
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: '$49',
      period: 'per month',
      description: 'Maximum security and features for growing companies.',
      icon: <Star className="w-6 h-6 text-amber-500" />,
      features: [
        'Everything in Pro',
        'Materialized View Analytics',
        'Custom Webhooks Integration',
        'SAML SSO Authentication',
        'Dedicated Success Manager',
      ],
      limits: {
        projects: 'Unlimited Projects',
        members: 'Unlimited Members',
        storage: '500 GB Storage',
      },
      buttonText: 'Go Enterprise',
    },
    {
      id: 'CUSTOM',
      name: 'Custom',
      price: 'Custom',
      period: 'tailored pricing',
      description: 'Bespoke plan limits and specialized infrastructure.',
      icon: <HelpCircle className="w-6 h-6 text-emerald-500" />,
      features: [
        'Tailored Resource Limits',
        'Dedicated Database Instances',
        '99.99% Guaranteed SLA uptime',
        'Custom Deployment Models',
        'Direct Engineering Contacts',
      ],
      limits: {
        projects: 'Fully Flexible',
        members: 'Fully Flexible',
        storage: 'Custom Limits',
      },
      buttonText: 'Contact Sales',
    },
  ];

  const handleCheckout = async (tierId: string) => {
    if (!activeWorkspace) {
      setErrorMsg('Please select a workspace first.');
      return;
    }

    if (tierId === 'FREE') return;
    if (tierId === 'CUSTOM') {
      alert('To customize your plan, please contact our support team.');
      return;
    }

    setErrorMsg('');
    setLoadingTier(tierId);

    try {
      const response = await apiClient.post(
        `/subscription/checkout/${activeWorkspace.id}`,
        {
          planId: tierId,
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Checkout failed');
      }

      const data = (await response.json()) as { checkoutUrl: string };
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned by provider');
      }
    } catch (err) {
      Logger.error('Checkout error:', err as Error);
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to launch checkout.',
      );
    } finally {
      setLoadingTier(null);
    }
  };

  const currentPlan = activeWorkspace?.subscription?.planLevel || 'FREE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 page-enter">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Flexible Plans for Modern Teams
        </h1>
        <p className="mt-5 text-xl text-gray-500 dark:text-gray-400">
          Scale your workspace limits dynamically. Choose the subscription tier
          that matches your speed.
        </p>
        {activeWorkspace && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-300">
            Active Workspace:{' '}
            <span className="text-indigo-400 font-bold">
              {activeWorkspace.name}
            </span>
            <span className="ml-2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentPlan} Plan
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto mb-10 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-sm font-semibold text-red-500">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const isCurrent = currentPlan === tier.id;
          const isLoading = loadingTier === tier.id;

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between p-8 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all duration-300 ${
                tier.popular
                  ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20 scale-105 md:scale-100 lg:scale-105 z-10'
                  : 'border-surface-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-lg'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider text-white bg-indigo-600 uppercase shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </h3>
                  {tier.icon}
                </div>

                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                  {tier.price !== 'Custom' && (
                    <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                      /{tier.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 min-h-[36px]">
                  {tier.description}
                </p>

                <div className="py-4 border-t border-b border-surface-100 dark:border-slate-800 mb-6 space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Tier Resource Limits
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📂 {tier.limits.projects}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    👥 {tier.limits.members}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    💾 {tier.limits.storage}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-indigo-500 shrink-0 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCheckout(tier.id)}
                disabled={isCurrent || isLoading || tier.id === 'FREE'}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default border border-transparent'
                    : tier.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-surface-200 dark:border-slate-800 hover:bg-surface-50 dark:hover:bg-slate-850'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                ) : isCurrent ? (
                  'Active Plan'
                ) : (
                  tier.buttonText
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
