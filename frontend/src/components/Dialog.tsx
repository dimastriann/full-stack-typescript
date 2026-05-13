import { Fragment } from 'react';
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'sm:max-w-2xl',
}: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-all" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-float transition-all sm:my-8 w-full ${maxWidth}`}
              >
                <div className="bg-white">
                  <div className="flex justify-between items-center px-6 py-5 border-b border-surface-100 bg-surface-50/50">
                    {title && (
                      <DialogTitle
                        as="h3"
                        className="text-lg font-bold leading-6 text-gray-900 tracking-tight"
                      >
                        {title}
                      </DialogTitle>
                    )}
                    <button
                      type="button"
                      className="rounded-full p-1.5 bg-white border border-surface-200 text-gray-400 hover:text-gray-600 hover:bg-surface-50 focus:outline-none transition-colors"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="px-6 py-6 max-h-[80vh] overflow-y-auto no-scrollbar">{children}</div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
