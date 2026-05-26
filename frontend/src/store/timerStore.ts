import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  isRunning: boolean;
  taskId: number | null;
  taskTitle: string | null;
  projectId: number | null;
  projectName: string | null;
  startedAt: number | null; // epoch ms
  elapsedMs: number; // accumulated ms before latest start
  start: (task: { id: number; title: string; projectId: number; projectName: string }) => void;
  stop: () => void;
  pause: () => void;
  reset: () => void;
  getElapsedMs: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      taskId: null,
      taskTitle: null,
      projectId: null,
      projectName: null,
      startedAt: null,
      elapsedMs: 0,

      start(task) {
        set({
          isRunning: true,
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.projectName,
          startedAt: Date.now(),
        });
      },

      pause() {
        const { startedAt, elapsedMs, isRunning } = get();
        if (!isRunning || !startedAt) return;
        set({
          isRunning: false,
          elapsedMs: elapsedMs + (Date.now() - startedAt),
          startedAt: null,
        });
      },

      stop() {
        const { startedAt, elapsedMs, isRunning } = get();
        const total = isRunning && startedAt
          ? elapsedMs + (Date.now() - startedAt)
          : elapsedMs;
        set({
          isRunning: false,
          startedAt: null,
          elapsedMs: 0,
          taskId: null,
          taskTitle: null,
          projectId: null,
          projectName: null,
        });
        return total;
      },

      reset() {
        set({
          isRunning: false,
          taskId: null,
          taskTitle: null,
          projectId: null,
          projectName: null,
          startedAt: null,
          elapsedMs: 0,
        });
      },

      getElapsedMs() {
        const { startedAt, elapsedMs, isRunning } = get();
        if (isRunning && startedAt) {
          return elapsedMs + (Date.now() - startedAt);
        }
        return elapsedMs;
      },
    }),
    { name: 'pf-timer' },
  ),
);
