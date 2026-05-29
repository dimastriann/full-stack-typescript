import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

export type MenuItemData = {
  title: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

interface DropDownChatProps {
  menuItems: MenuItemData[];
}

export default function DropDownChat({ menuItems }: DropDownChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-surface-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-surface-200 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
      >
        <Plus size={22} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-4 w-56 origin-bottom-right rounded-2xl bg-white dark:bg-slate-900 shadow-float border border-surface-200 dark:border-slate-800 focus:outline-none overflow-hidden py-1.5 animate-slide-in-up">
          {menuItems.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                item.onClick(e);
              }}
              className="group flex w-full items-center gap-3.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 transition-all focus:outline-none"
            >
              <span className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {item.icon}
              </span>
              <span className="font-bold">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
