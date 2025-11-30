import TaskList from '../components/TaskList';
import { TaskProvider } from '../hooks/useTasks';

export default function TaskPage(): React.ReactElement {
  return (
    <TaskProvider>
      <TaskList />
    </TaskProvider>
  );
}
