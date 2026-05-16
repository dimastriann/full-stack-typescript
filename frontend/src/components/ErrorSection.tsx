import { X } from 'lucide-react';
import { useState } from 'react';

export default function ErrorSection({
  errorMessage,
  close,
}: {
  errorMessage: string;
  close: (val: string) => void;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyCliboard = async () => {
    await navigator.clipboard.writeText(errorMessage);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 my-4 animate-slide-in-up transition-colors relative group">
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm font-bold text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
        <button
          onClick={() => close('')}
          className="p-1 rounded-lg text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={copyCliboard}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
        >
          Copy to Clipboard
        </button>
        {isCopied && (
          <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest animate-fade-in">
            Copied Successfully
          </span>
        )}
      </div>
    </div>
  );
}
