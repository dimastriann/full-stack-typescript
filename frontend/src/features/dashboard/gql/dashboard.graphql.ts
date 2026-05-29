import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($workspaceId: Int) {
    dashboardStats(workspaceId: $workspaceId) {
      totalUsers
      activeProjects
      pendingTasks
      completedThisWeek
      overdueTasks

      tasksByStage {
        stage
        count
        color
      }

      tasksByPriority {
        priority
        count
      }

      projectsProgress {
        id
        projectName
        progress
        budgetPlanned
        budgetActual
      }

      activityTimeline {
        date
        tasksCreated
        tasksCompleted
        hoursLogged
      }

      upcomingDeadlines {
        id
        title
        dueDate
        priority
        projectName
        stageName
        stageColor
      }

      recentActivity {
        id
        type
        title
        userName
        timestamp
        projectName
      }

      timesheetSummary {
        thisWeek
        lastWeek
        thisMonth
      }
    }
  }
`;
