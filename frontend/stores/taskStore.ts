import { create } from 'zustand';
import api from '../services/api';
import * as sqliteService from '../services/sqliteService';
import NetInfo from '@react-native-community/netinfo';

export interface Task {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'normal' | 'hard' | 'epic';
  exp_reward: number;
  hp_penalty: number;
  status: 'pending' | 'done' | 'failed' | 'skipped';
  source: 'manual' | 'ai';
  tags: string[];
  duration_minutes?: number;
  completed_at?: string;
  created_at?: string;
  isOffline?: boolean;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  isSyncing: boolean;
  unsyncedCount: number;
  fetchTasks: (params?: { date?: string; start_date?: string; end_date?: string; status?: string }) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'status'>) => Promise<{ task: Task; levelUp?: any; newAchievements?: string[] }>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<any>;
  aiParseTask: (text: string) => Promise<{ task: Task; aiAvailable: boolean }>;
  syncOfflineTasks: () => Promise<void>;
  checkUnsyncedCount: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isSyncing: false,
  unsyncedCount: 0,

  fetchTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        const offlineTasks = await sqliteService.getAllOfflineTasks();
        set({ tasks: offlineTasks.map(t => ({ ...t, isOffline: true })), isLoading: false });
        return;
      }
      const { data } = await api.get('/tasks', { params });
      set({ tasks: data.data, isLoading: false });
    } catch {
      const offlineTasks = await sqliteService.getAllOfflineTasks();
      set({ tasks: offlineTasks.map(t => ({ ...t, isOffline: true })), isLoading: false });
    }
  },

  createTask: async (task) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const clientId = await sqliteService.saveOfflineTask(task as any);
      const newTask: Task = { ...task, id: clientId, client_id: clientId, status: 'pending', isOffline: true };
      set(s => ({ tasks: [newTask, ...s.tasks], unsyncedCount: s.unsyncedCount + 1 }));
      return { task: newTask };
    }
    const { data } = await api.post('/tasks', task);
    set(s => ({ tasks: [data.data, ...s.tasks] }));
    return { task: data.data };
  },

  updateTask: async (id, updates) => {
    await api.put(`/tasks/${id}`, updates);
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
  },

  completeTask: async (id) => {
    const { data } = await api.patch(`/tasks/${id}/complete`);
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t) }));
    return data.data;
  },

  aiParseTask: async (text) => {
    const { data } = await api.post('/tasks/ai-parse', { text });
    const task = data.data.task;
    set(s => ({ tasks: [task, ...s.tasks] }));
    return { task, aiAvailable: data.data.ai_available };
  },

  syncOfflineTasks: async () => {
    set({ isSyncing: true });
    try {
      const unsynced = await sqliteService.getUnsyncedTasks();
      if (unsynced.length === 0) { set({ isSyncing: false }); return; }
      const { data } = await api.post('/tasks/sync', { tasks: unsynced });
      for (const result of data.data.results) {
        if (result.synced && result.client_id) {
          await sqliteService.markTaskSynced(result.client_id);
        }
      }
      set({ isSyncing: false, unsyncedCount: 0 });
      await get().fetchTasks();
    } catch {
      set({ isSyncing: false });
    }
  },

  checkUnsyncedCount: async () => {
    const count = await sqliteService.countUnsyncedTasks();
    set({ unsyncedCount: count });
  },
}));
