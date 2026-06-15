import { useNavigate } from 'react-router-dom';
import { usePaywallStore } from '../../store/paywallStore';
import Modal from '../Dialog';
import { Zap, Sparkles } from 'lucide-react';

export default function PaywallModal() {
  const navigate = useNavigate();
  const { isOpen, limitType, closePaywall } = usePaywallStore();

  const handleUpgradeClick = () => {
    closePaywall();
    navigate('/dashboard/pricing');
  };

  const getLimitDetails = () => {
    switch (limitType) {
      case 'project':
        return {
          title: 'Project Limit Reached',
          description:
            'Your workspace has reached the maximum number of projects allowed on the Free plan tier (3 projects). Upgrade to Pro to create up to 20 projects or Enterprise for unlimited projects.',
        };
      case 'member':
        return {
          title: 'Workspace Member Limit Reached',
          description:
            'You have reached the maximum member invitation limit allowed on your workspace plan. Upgrade to a higher tier to collaborate with more team members.',
        };
      case 'storage':
        return {
          title: 'Storage Space Exceeded',
          description:
            'Your workspace has exceeded the allocated file storage limit. Upgrade your subscription to unlock more storage space for project attachments.',
        };
      default:
        return {
          title: 'Plan Limit Exceeded',
          description:
            'You have hit a resource limit on your current workspace plan. Please upgrade your subscription to unlock additional resources.',
        };
    }
  };

  const details = getLimitDetails();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closePaywall}
      title={details.title}
      maxWidth="sm:max-w-md"
    >
      <div className="text-center py-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-6 animate-pulse">
          <Zap className="h-8 w-8" />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {details.description}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-700 hover:from-primary-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Subscription
          </button>

          <button
            onClick={closePaywall}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
}
