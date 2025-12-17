import TimesheetList from '../components/TimesheetList';
import { TimesheetProvider } from '../hooks/useTimesheets';

export default function TimesheetPage() {
  return (
    <TimesheetProvider>
      <TimesheetList />
    </TimesheetProvider>
  );
}
