import { useNavigate, useParams } from 'react-router-dom';
import TimesheetForm from '../components/TimesheetForm';
import { useQuery } from '@apollo/client';
import { GET_TIMESHEET } from '../gql/timesheet.graphql';

export default function TimesheetFormPage() {
  const navigate = useNavigate();
  const { timesheetId } = useParams();
  const id = timesheetId ? parseInt(timesheetId, 10) : 0;

  const { data } = useQuery(GET_TIMESHEET, {
    variables: { id },
    skip: !id,
  });

  const timesheet = data?.getTimesheet;

  return (
    <div className="mx-auto py-6 h-full flex flex-col max-w-4xl page-enter">
      {/* ── Header Card ── */}
      {id > 0 && timesheet && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                TS-{id}
              </span>
              {timesheet.billable && (
                <span className="badge bg-green-100 text-green-700">Billable</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Timesheet</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm bg-surface-50 p-3 rounded-xl border border-surface-200">
             <div className="flex flex-col items-end border-r border-surface-200 pr-4">
               <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Time Spent</span>
               <span className="font-bold text-gray-900 text-lg">{timesheet.timeSpent}h</span>
             </div>
             <div className="flex flex-col items-end pl-2">
               <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Total Cost</span>
               <span className="font-bold text-primary-600 text-lg">${timesheet.cost?.toLocaleString() || '0.00'}</span>
             </div>
          </div>
        </div>
      )}

      {!id && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Timesheet</h1>
          <p className="text-gray-500 text-sm mt-1">Log your work hours below.</p>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6">
        <TimesheetForm
          onCancel={() => navigate('/dashboard/timesheets')}
          onSuccess={() => navigate('/dashboard/timesheets')}
        />
      </div>
    </div>
  );
}
