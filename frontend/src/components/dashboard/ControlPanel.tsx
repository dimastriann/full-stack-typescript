import {
  Search,
  Plus,
  Trash2,
  Download,
  Printer,
  Settings2,
  TableIcon,
  KanbanIcon,
} from 'lucide-react';
import { MenuButton, MenuItems, MenuItem, Menu } from '@headlessui/react';
import { useState } from 'react';
import type { viewType } from '../../types/View';
import { ModernUserTable } from '../../features/template/Template';
import { FormView } from '../../features/template/TemplateForm';
import KanbanBoard from '../../features/template/TemplateKanban';

export default function ControlPanel() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [view, setViewType] = useState<viewType>('table');
  const viewMapping = {
    table: <ModernUserTable setViewType={setViewType} />,
    form: <FormView />,
    kanban: <KanbanBoard />,
  };

  return (
    <div>
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-2 py-1.5 rounded focus:outline-[#3b0a84] focus:outline border border-gray-300 focus:border-[#3b0a84]"
          />
        </div>
        <div className="flex gap-1">
          <TableIcon
            onClick={() => setViewType('table')}
            size={'2rem'}
            className="cursor-pointer bg-gray-200 border p-1"
          />
          <KanbanIcon
            onClick={() => setViewType('kanban')}
            size={'2rem'}
            className="cursor-pointer border p-1"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-2 text-sm text-blue-600 text-center">
            {selectedIds.length} row(s) selected
          </div>
        )}

        <div className="flex gap-2 items-center">
          {selectedIds.length > 0 && (
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="bg-gray-200 px-2 py-2 rounded hover:bg-gray-300 text-sm">
                <Settings2 size={'1rem'} className="inline me-1" />
                Actions
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded shadow-lg z-10">
                <div className="py-1">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => alert('Export')}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full px-4 py-2 text-left text-sm`}
                      >
                        <Download size={'1rem'} className="inline me-1" />
                        Export
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => alert('Delete')}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full px-4 py-2 text-left text-sm text-red-500`}
                      >
                        <Trash2 size={'1rem'} className="inline me-1" />
                        Delete
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => alert('Print')}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full px-4 py-2 text-left text-sm`}
                      >
                        <Printer size={'1rem'} className="inline me-1" />
                        Print
                      </button>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          )}
          <button
            onClick={() => setViewType('form')}
            className="rounded-md bg-[#3b0a84] ps-2 pe-3 py-2 text-sm font-medium text-white hover:bg-[#2a0761] transition-colors"
          >
            <Plus size={'1.2rem'} className="inline" />
            <span>Create</span>
          </button>
          {/* <DnDialog /> */}
        </div>
      </div>
    </div>
  );
}
