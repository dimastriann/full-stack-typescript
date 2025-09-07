import { useState } from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { Plus } from 'lucide-react';

interface dialogForm {
  title: string;
  data?: {};
}

export function DnDialog({ title }: dialogForm): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-[#3b0a84] ps-2 pe-3 py-2 text-sm font-medium text-white hover:bg-[#2a0761] transition-colors"
      >
        <Plus className="inline" size={'1.2rem'} />
        Create
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-10"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Create {title}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <DnDialogForm onCancel={() => setIsOpen(false)} />
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function DnDialogForm({ onCancel }: { onCancel: () => void }) {
  const initialData = {
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
  };

  return (
    <form className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <img
          src={initialData.avatar}
          alt="Avatar"
          className="w-16 h-16 rounded-full border"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
        >
          Change Avatar
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Name" name="name" defaultValue={initialData.name} />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={initialData.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={initialData.password}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={initialData.phone}
        />
        <InputField
          label="Mobile"
          name="mobile"
          defaultValue={initialData.mobile}
        />
        <InputField
          label="Birth Date"
          name="birthDate"
          type="date"
          defaultValue={initialData.birthDate}
        />
      </div>

      {/* Personal Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="First Name"
          name="firstName"
          defaultValue={initialData.firstName}
        />
        <InputField
          label="Last Name"
          name="lastName"
          defaultValue={initialData.lastName}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={initialData.status}
          options={['Active', 'Inactive']}
        />
        <SelectField
          label="Role"
          name="role"
          defaultValue={initialData.role}
          options={['Admin', 'User', 'Guest']}
        />
      </div>

      {/* Address & Bio */}
      <InputField
        label="Address"
        name="address"
        defaultValue={initialData.address}
      />
      <TextareaField label="Bio" name="bio" defaultValue={initialData.bio} />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={onCancel}
          className="rounded-md bg-[#3b0a84] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a0761] transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function InputField({ label, name, type = 'text', defaultValue }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="block w-full bg-gray-50 px-1 py-1 focus:outline-[#3b0a84] focus:outline rounded border-b-2 border-gray-300 focus:border-[#3b0a84]"
      />
    </div>
  );
}

function SelectField({ label, name, defaultValue, options }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="block w-full bg-gray-50 px-1 py-1 focus:outline-[#3b0a84] focus:outline rounded border-b-2 border-gray-300 focus:border-[#3b0a84] sm:text-sm"
      >
        {options.map((opt: string) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, name, defaultValue }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="block w-full bg-gray-50 px-1 py-1 focus:outline-[#3b0a84] focus:outline rounded border-b-2 border-gray-300 focus:border-[#3b0a84] sm:text-sm"
      />
    </div>
  );
}

export default function ExampleInput() {
  return (
    <div>
      <label
        htmlFor="price"
        className="block text-sm/6 font-medium text-gray-900"
      >
        Price
      </label>
      <div className="mt-2">
        <div className="">
          <input
            placeholder="Your full name"
            className="mx-auto block w-full max-w-xs bg-gray-50 px-1 py-1 focus:outline-[#3b0a84] focus:outline rounded border-b-2 border-gray-300 focus:border-[#3b0a84]"
            type="text"
          />
        </div>
      </div>
    </div>
  );
}

export function FormView() {
  const initialData = {
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
  };
  return (
    <div>
      <form className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <img
            src={initialData.avatar}
            alt="Avatar"
            className="w-16 h-16 rounded-full border"
          />
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Change Avatar
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Name"
            name="name"
            defaultValue={initialData.name}
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            defaultValue={initialData.email}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            defaultValue={initialData.password}
          />
          <InputField
            label="Phone"
            name="phone"
            defaultValue={initialData.phone}
          />
          <InputField
            label="Mobile"
            name="mobile"
            defaultValue={initialData.mobile}
          />
          <InputField
            label="Birth Date"
            name="birthDate"
            type="date"
            defaultValue={initialData.birthDate}
          />
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            name="firstName"
            defaultValue={initialData.firstName}
          />
          <InputField
            label="Last Name"
            name="lastName"
            defaultValue={initialData.lastName}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={initialData.status}
            options={['Active', 'Inactive']}
          />
          <SelectField
            label="Role"
            name="role"
            defaultValue={initialData.role}
            options={['Admin', 'User', 'Guest']}
          />
        </div>

        {/* Address & Bio */}
        <InputField
          label="Address"
          name="address"
          defaultValue={initialData.address}
        />
        <TextareaField label="Bio" name="bio" defaultValue={initialData.bio} />
      </form>
    </div>
  );
}
