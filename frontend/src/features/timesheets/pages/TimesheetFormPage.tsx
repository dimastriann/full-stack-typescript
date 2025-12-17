import { TimesheetProvider } from '../hooks/useTimesheets';
import TimesheetForm from '../components/TimesheetForm';
import { useNavigate } from 'react-router-dom';

export default function TimesheetFormPage() {
  const navigate = useNavigate();
  return (
    <TimesheetProvider>
      <TimesheetForm
        onCancel={() => navigate('/dashboard/timesheets')}
        onSuccess={() => navigate('/dashboard/timesheets')}
      />
    </TimesheetProvider>
  );
}
