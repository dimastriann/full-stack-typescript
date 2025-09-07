// components/Table/Table.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Download,
  Printer,
  Settings2,
  TableIcon,
  KanbanIcon,
} from 'lucide-react';
// import Pagination from './Pagination';
import { MenuButton, MenuItems, MenuItem, Menu, Tab } from '@headlessui/react';
import { DnDialog } from './TemplateForm';
import KanbanBoard from './TemplateKanban';
import { FormView } from './TemplateForm';

type viewType = 'table' | 'form' | 'kanban';

export default function TemplateView() {
  const [view, setViewType] = useState<viewType>('table');
  const viewMapping = {
    table: <ModernUserTable setViewType={setViewType} />,
    form: <FormView />,
    kanban: <KanbanBoard />,
  };
  return (
    <>
      {/* <div>Template View</div> */}
      {/* <Table 
            data={tableData} 
            columns={[
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
            { key: 'role', label: 'Role', sortable: true },
            ]}
            onCreate={() => alert('Create clicked')}
        /> */}
      {/* <ModernUserTable setViewType={setViewType} />
            {view === "form" && <FormView />}
            <div className='my-2'></div> */}
      {viewMapping[view]}
      {/* <KanbanBoard/> */}
    </>
  );
}

export const tableData = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'Editor' },
  { id: 3, name: 'Charlie', role: 'Viewer' },
  { id: 4, name: 'Diana', role: 'Manager' },
  { id: 5, name: 'Evan', role: 'Guest' },
  { id: 6, name: 'Fiona', role: 'Editor' },
];

type Column<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onCreate?: () => void;
  pageSize?: number;
};

export function Table<T extends object>({
  data,
  columns,
  onCreate,
  pageSize = 5,
}: TableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    const lower = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lower),
      ),
    );
  }, [search, data]);

  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const toggleSort = (key: keyof T) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white shadow rounded p-4 w-full">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 flex justify-center">
          <div className="relative w-1/3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-4 py-2 border rounded w-full focus:outline-none focus:ring"
            />
          </div>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
          >
            <Plus className="mr-1 h-4 w-4" />
            Create
          </button>
        )}
      </div>

      {/* Table */}
      <table className="w-full table-auto text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="py-2 px-4 cursor-pointer select-none"
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{col.label}</span>
                  {col.sortable && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b hover:bg-gray-50 transition"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="py-2 px-4">
                    {String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 text-center text-gray-500"
              >
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

// components/Table/Pagination.tsx
type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

type User = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  password: string;
  phone: string;
  mobile: string;
  firstName: string;
  lastName: string;
  status: string;
  address: string;
  bio: string;
  birthDate: string;
  role: string;
};

const allUsers: User[] = [
  {
    id: 1,
    name: 'Dimas Trian',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 3,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 4,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 5,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 6,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 7,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
  {
    id: 8,
    name: 'Dimas',
    email: 'dimas@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    password: '••••••••',
    phone: '021-123456',
    mobile: '+62 812 3456 7890',
    firstName: 'Dimas',
    lastName: 'Suryawan',
    status: 'Active',
    address: 'Jakarta, Indonesia',
    bio: 'Fullstack developer & tech enthusiast.',
    birthDate: '1998-10-12',
    role: 'Admin',
  },
];

// const columns = [
//     { key: 'name', label: 'Name' },
//     { key: 'email', label: 'Email' },
//     { key: 'phone', label: 'Phone' },
//     { key: 'mobile', label: 'Mobile' },
//     { key: 'firstName', label: 'First Name' },
//     { key: 'lastName', label: 'Last Name' },
//     { key: 'status', label: 'Status' },
//     { key: 'address', label: 'Address' },
//     { key: 'bio', label: 'Bio' },
//     { key: 'birthDate', label: 'Birth Date' },
//     { key: 'role', label: 'Role' },
// ];

// const statusTabs = ['All', 'Active', 'Inactive'];

export function ModernUserTable({
  setViewType,
}: {
  setViewType: (view: viewType) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortKey, setSortKey] = useState<keyof User | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSort = (key: keyof User) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (ids: number[]) => {
    if (selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const filtered = useMemo(() => {
    return allUsers
      .filter((user) => (filter === 'All' ? true : user.status === filter))
      .filter((user) =>
        Object.values(user).some((val) =>
          String(val).toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [filter, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortOrder]);

  return (
    <div className="p-4 bg-gray-100 max-lg:w-[80%]">
      <div className="bg-white shadow rounded-lg p-4">
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
            {/* <button 
                            onClick={() => setViewType("form")}
                            className="rounded-md bg-[#3b0a84] ps-2 pe-3 py-2 text-sm font-medium text-white hover:bg-[#2a0761] transition-colors">
                            <Plus size={"1.2rem"} className="inline" />
                            <span>Create</span>
                        </button> */}
            <DnDialog title="User" />
          </div>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-4 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-1.5 rounded ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div> */}

        {/* Table */}
        <div className="rounded border">
          <table className="min-w-full table-auto text-sm border-collapse">
            <thead className="bg-gray-100 text-left text-gray-700">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    onChange={() => toggleSelectAll(sorted.map((u) => u.id))}
                    checked={selectedIds.length === sorted.length}
                  />
                </th>
                <th className="px-4 py-2">Avatar</th>
                <th
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortKey === 'name' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50 transition border-b cursor-pointer">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => toggleExpand(user.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {expandedRows.includes(user.id) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      <button className="text-green-600 hover:underline">
                        <Pencil size={16} />
                      </button>
                      <button className="text-red-600 hover:underline">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>

                  {expandedRows.includes(user.id) && (
                    <tr className="bg-gray-50">
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-gray-600 text-sm"
                      >
                        <strong>Bio:</strong> {user.bio} <br />
                        <strong>Address:</strong> {user.address}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {sorted.length} user{sorted.length !== 1 ? 's' : ''}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={() => console.info('page')}
          />
        </div>
      </div>
    </div>
  );
}
