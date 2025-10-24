import UserList from '../components/UserList';
// import UserForm from '../components/UserForm';
// import { useEffect, useState } from 'react';
// import FeatureLayout from '../../../layout/FeatureLayout';
// import KanbanBoard from '../../template/TemplateKanban';
import { UserProvider } from '../hooks/useUsers';
// import { useParams } from 'react-router-dom';

export default function UserPage() {
  // const [activeView, setActiveView] = useState<'form' | 'table' | 'kanban'>(
  //   'table',
  // );
  // const [search, setSearch] = useState('');
  // const { refetch } = useUsers();

  // const params = useParams();
  // console.log('params', params.userId);

  // useEffect(() => {refetch()}, [activeView])

  return (
    <>
      <UserProvider>
        <UserList />
      </UserProvider>
      {/* <h2 className="text-2xl font-bold text-[#3b0a84]">Manage Users</h2>
            <UserForm />
            <UserList /> */}

      {/* <FeatureLayout
        activeView={activeView}
        setActiveView={setActiveView}
        search={search}
        setSearch={setSearch}
        views={{
          form: <UserForm setActiveView={setActiveView} />,
          table: <UserList />,
          kanban: <KanbanBoard />,
        }}
        title="User"
      /> */}
    </>
  );
}
