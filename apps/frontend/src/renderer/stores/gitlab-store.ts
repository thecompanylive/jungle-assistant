import { create } from 'zustand';
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
import type {
  GitLabIssue,
  GitLabSyncStatus,
  GitLabInvestigationStatus,
  GitLabInvestigationResult
} from '../../shared/types';

interface GitLabState {
  // Data
  issues: GitLabIssue[];
  syncStatus: GitLabSyncStatus | null;
========
import type { GitHubIssue } from '../../../shared/types';

export type IssueFilterState = 'open' | 'closed' | 'all';

interface IssuesState {
  // Data
  issues: GitHubIssue[];
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts

  // UI State
  isLoading: boolean;
  error: string | null;
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
  selectedIssueIid: number | null;
  filterState: 'opened' | 'closed' | 'all';

  // Investigation state
  investigationStatus: GitLabInvestigationStatus;
  lastInvestigationResult: GitLabInvestigationResult | null;

  // Actions
  setIssues: (issues: GitLabIssue[]) => void;
  addIssue: (issue: GitLabIssue) => void;
  updateIssue: (issueIid: number, updates: Partial<GitLabIssue>) => void;
  setSyncStatus: (status: GitLabSyncStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectIssue: (issueIid: number | null) => void;
  setFilterState: (state: 'opened' | 'closed' | 'all') => void;
  setInvestigationStatus: (status: GitLabInvestigationStatus) => void;
  setInvestigationResult: (result: GitLabInvestigationResult | null) => void;
========
  selectedIssueNumber: number | null;
  filterState: IssueFilterState;

  // Actions
  setIssues: (issues: GitHubIssue[]) => void;
  addIssue: (issue: GitHubIssue) => void;
  updateIssue: (issueNumber: number, updates: Partial<GitHubIssue>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectIssue: (issueNumber: number | null) => void;
  setFilterState: (state: IssueFilterState) => void;
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  clearIssues: () => void;

  // Selectors
  getSelectedIssue: () => GitLabIssue | null;
  getFilteredIssues: () => GitLabIssue[];
  getOpenIssuesCount: () => number;
}

<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
export const useGitLabStore = create<GitLabState>((set, get) => ({
========
export const useIssuesStore = create<IssuesState>((set, get) => ({
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  // Initial state
  issues: [],
  isLoading: false,
  error: null,
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
  selectedIssueIid: null,
  filterState: 'opened',
  investigationStatus: {
    phase: 'idle',
    progress: 0,
    message: ''
  },
  lastInvestigationResult: null,
========
  selectedIssueNumber: null,
  filterState: 'open',
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts

  // Actions
  setIssues: (issues) => set({ issues, error: null }),

  addIssue: (issue) => set((state) => ({
    issues: [issue, ...state.issues.filter(i => i.iid !== issue.iid)]
  })),

  updateIssue: (issueIid, updates) => set((state) => ({
    issues: state.issues.map(issue =>
      issue.iid === issueIid ? { ...issue, ...updates } : issue
    )
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  selectIssue: (selectedIssueIid) => set({ selectedIssueIid }),

  setFilterState: (filterState) => set({ filterState }),

  clearIssues: () => set({
    issues: [],
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
    syncStatus: null,
    selectedIssueIid: null,
    error: null,
    investigationStatus: { phase: 'idle', progress: 0, message: '' },
    lastInvestigationResult: null
========
    selectedIssueNumber: null,
    error: null
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  }),

  // Selectors
  getSelectedIssue: () => {
    const { issues, selectedIssueIid } = get();
    return issues.find(i => i.iid === selectedIssueIid) || null;
  },

  getFilteredIssues: () => {
    const { issues, filterState } = get();
    if (filterState === 'all') return issues;
    return issues.filter(issue => issue.state === filterState);
  },

  getOpenIssuesCount: () => {
    const { issues } = get();
    return issues.filter(issue => issue.state === 'opened').length;
  }
}));

// Action functions for use outside of React components
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
export async function loadGitLabIssues(projectId: string, state?: 'opened' | 'closed' | 'all'): Promise<void> {
  const store = useGitLabStore.getState();
========
export async function loadGitHubIssues(projectId: string, state?: IssueFilterState): Promise<void> {
  const store = useIssuesStore.getState();
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  store.setLoading(true);
  store.setError(null);

  // Sync filterState with the requested state
  if (state) {
    store.setFilterState(state);
  }

  try {
    const result = await window.electronAPI.getGitLabIssues(projectId, state);
    if (result.success && result.data) {
      store.setIssues(result.data);
    } else {
      store.setError(result.error || 'Failed to load GitLab issues');
    }
  } catch (error) {
    store.setError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    store.setLoading(false);
  }
}

<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
export async function checkGitLabConnection(projectId: string): Promise<GitLabSyncStatus | null> {
  const store = useGitLabStore.getState();

  try {
    const result = await window.electronAPI.checkGitLabConnection(projectId);
    if (result.success && result.data) {
      store.setSyncStatus(result.data);
      return result.data;
    } else {
      store.setError(result.error || 'Failed to check GitLab connection');
      return null;
    }
  } catch (error) {
    store.setError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function investigateGitLabIssue(projectId: string, issueIid: number, selectedNoteIds?: number[]): void {
  const store = useGitLabStore.getState();
  store.setInvestigationStatus({
    phase: 'fetching',
    issueIid,
    progress: 0,
    message: 'Starting investigation...'
  });
  store.setInvestigationResult(null);

  window.electronAPI.investigateGitLabIssue(projectId, issueIid, selectedNoteIds);
}

export async function importGitLabIssues(
========
export async function importGitHubIssues(
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  projectId: string,
  issueIids: number[]
): Promise<boolean> {
<<<<<<<< HEAD:apps/frontend/src/renderer/stores/gitlab-store.ts
  const store = useGitLabStore.getState();
========
  const store = useIssuesStore.getState();
>>>>>>>> develop2:apps/frontend/src/renderer/stores/github/issues-store.ts
  store.setLoading(true);

  try {
    const result = await window.electronAPI.importGitLabIssues(projectId, issueIids);
    if (result.success) {
      return true;
    } else {
      store.setError(result.error || 'Failed to import GitLab issues');
      return false;
    }
  } catch (error) {
    store.setError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  } finally {
    store.setLoading(false);
  }
}
