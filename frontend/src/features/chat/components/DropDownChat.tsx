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
        className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none"
      >
        <Plus size={20} className="text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-56 origin-bottom-right rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden py-1 transform transition-all">
          {menuItems.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                item.onClick(e);
              }}
              className="group flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors focus:outline-none focus:bg-gray-100"
            >
              <span className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors">
                {item.icon}
              </span>
              <span className="font-medium">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
