import { create } from 'zustand';
import api from '../services/api';
import { useAuthStore } from './authStore';

// ══════════════════════════════════════════════════════════════════
// TASK STORE — Quản lý Habits, Dailies, To-Dos (Zustand)
// ══════════════════════════════════════════════════════════════════

export interface Task {
  id: number;
  user_id: number;
  type: 'habit' | 'daily' | 'todo';
  title: string;
  notes: string | null;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  positive_count: number;
  negative_count: number;
  last_positive_at: string | null;
  is_completed_today: boolean;
  streak: number;
  repeat_days: string;
  due_date: string | null;
  is_done: boolean;
  done_at: string | null;
  base_exp_reward: number;
  base_gold_reward: string;
  created_at: string;
}

interface ScoreResult {
  direction: string;
  expEarned: number;
  goldEarned: number;
  levelUp: {
    levelsGained: number;
    newBuffs: string[];
    level: number;
  } | null;
  multiplier?: number;
  daysOverdue?: number;
}

interface TaskState {
  habits: Task[];
  dailies: Task[];
  todos: Task[];
  isLoading: boolean;
  lastScoreResult: ScoreResult | null;

  fetchTasks: (type?: string) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  scoreHabit: (id: number, direction: 'positive' | 'negative') => Promise<ScoreResult>;
  completeDaily: (id: number) => Promise<ScoreResult>;
  uncompleteDaily: (id: number) => Promise<void>;
  completeTodo: (id: number) => Promise<ScoreResult>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  habits: [],
  dailies: [],
  todos: [],
  isLoading: false,
  lastScoreResult: null,

  fetchTasks: async (type) => {
    set({ isLoading: true });
    try {
      const url = type ? `/tasks?type=${type}` : '/tasks';
      const { data } = await api.get(url);
      const tasks: Task[] = data.data;

      if (type) {
        if (type === 'habit') set({ habits: tasks });
        else if (type === 'daily') set({ dailies: tasks });
        else if (type === 'todo') set({ todos: tasks });
      } else {
        set({
          habits: tasks.filter(t => t.type === 'habit'),
          dailies: tasks.filter(t => t.type === 'daily'),
          todos: tasks.filter(t => t.type === 'todo'),
        });
      }
    } catch (err) {
      console.error('Lỗi fetch tasks:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await api.post('/tasks', taskData);
      await get().fetchTasks(taskData.type);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Tạo task thất bại');
    }
  },

  updateTask: async (id, taskData) => {
    try {
      await api.put(`/tasks/${id}`, taskData);
      await get().fetchTasks();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Cập nhật task thất bại');
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      await get().fetchTasks();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Xóa task thất bại');
    }
  },

  scoreHabit: async (id, direction) => {
    try {
      const { data } = await api.post(`/tasks/${id}/score`, { direction });
      set({ lastScoreResult: data.data });
      
      // Cập nhật thanh HP/EXP và danh sách task song song, không block UI
      useAuthStore.getState().refreshUser();
      get().fetchTasks('habit');
      
      return data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Score habit thất bại');
    }
  },

  completeDaily: async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/complete-daily`);
      set({ lastScoreResult: data.data });
      
      useAuthStore.getState().refreshUser(); // Cập nhật thanh HP/EXP
      get().fetchTasks('daily');
      
      return data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Complete daily thất bại');
    }
  },

  uncompleteDaily: async (id) => {
    try {
      await api.post(`/tasks/${id}/uncomplete-daily`);
      await get().fetchTasks('daily');
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Uncomplete daily thất bại');
    }
  },

  completeTodo: async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/complete-todo`);
      set({ lastScoreResult: data.data });
      
      useAuthStore.getState().refreshUser(); // Cập nhật thanh HP/EXP
      get().fetchTasks('todo');
      
      return data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Complete todo thất bại');
    }
  },
}));
