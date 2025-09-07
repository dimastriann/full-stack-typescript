import TaskList from '../components/TaskList';

export default function TaskPage(): React.ReactElement {
  return (
    <>
      <h2 className="text-2xl font-bold text-[#3b0a84]">Manage Tasks</h2>
      <TaskList />
    </>
  );
}
