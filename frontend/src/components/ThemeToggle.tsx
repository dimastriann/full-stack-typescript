import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2 rounded-xl bg-surface-100 dark:bg-sidebar-hover text-gray-600 dark:text-sidebar-text hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group overflow-hidden border border-surface-200 dark:border-sidebar-border"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 transition-all duration-500 transform ${
            theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          size={20}
        />
        <Moon
          className={`absolute inset-0 transition-all duration-500 transform ${
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          size={20}
        />
      </div>
      
      {/* Subtle hover background effect */}
      <span className="absolute inset-0 bg-primary-500/5 dark:bg-primary-400/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl" />
    </button>
  );
};
