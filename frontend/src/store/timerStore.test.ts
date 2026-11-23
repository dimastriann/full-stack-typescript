import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimerStore } from './timerStore';

const task = {
  id: 11,
  title: 'Write e2e tests',
  projectId: 3,
  projectName: 'ProjectFlow',
};

describe('timerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    localStorage.clear();
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a timer for a task', () => {
    useTimerStore.getState().start(task);

    expect(useTimerStore.getState()).toMatchObject({
      isRunning: true,
      taskId: 11,
      taskTitle: 'Write e2e tests',
      projectId: 3,
      projectName: 'ProjectFlow',
    });
    expect(useTimerStore.getState().startedAt).toBe(Date.now());
  });

  it('accumulates elapsed time while running', () => {
    useTimerStore.getState().start(task);
    vi.advanceTimersByTime(2_500);

    expect(useTimerStore.getState().getElapsedMs()).toBe(2_500);
  });

  it('freezes the elapsed time when paused and resumes on restart', () => {
    useTimerStore.getState().start(task);
    vi.advanceTimersByTime(1_000);
    useTimerStore.getState().pause();

    expect(useTimerStore.getState().isRunning).toBe(false);
    expect(useTimerStore.getState().startedAt).toBeNull();
    expect(useTimerStore.getState().getElapsedMs()).toBe(1_000);

    vi.advanceTimersByTime(5_000);
    expect(useTimerStore.getState().getElapsedMs()).toBe(1_000);

    useTimerStore.getState().start(task);
    vi.advanceTimersByTime(500);
    expect(useTimerStore.getState().getElapsedMs()).toBe(1_500);
  });

  it('ignores pause requests when no timer is running', () => {
    useTimerStore.getState().pause();

    expect(useTimerStore.getState().isRunning).toBe(false);
    expect(useTimerStore.getState().elapsedMs).toBe(0);
  });

  it('returns the total elapsed time and clears state on stop', () => {
    useTimerStore.getState().start(task);
    vi.advanceTimersByTime(3_000);

    const total = (
      useTimerStore.getState().stop as unknown as () => number
    ).call(useTimerStore.getState());

    expect(total).toBe(3_000);
    expect(useTimerStore.getState()).toMatchObject({
      isRunning: false,
      taskId: null,
      startedAt: null,
      elapsedMs: 0,
    });
  });

  it('persists timer state to local storage', () => {
    useTimerStore.getState().start(task);

    const persisted = JSON.parse(localStorage.getItem('pf-timer') ?? '{}');
    expect(persisted.state.taskId).toBe(11);
    expect(persisted.state.isRunning).toBe(true);
  });
});
