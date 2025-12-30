import { ProjectAPI, createProjectAPI } from './project-api';
import { TerminalAPI, createTerminalAPI } from './terminal-api';
import { TaskAPI, createTaskAPI } from './task-api';
import { SettingsAPI, createSettingsAPI } from './settings-api';
import { FileAPI, createFileAPI } from './file-api';
import { AgentAPI, createAgentAPI } from './agent-api';
import { IdeationAPI, createIdeationAPI } from './modules/ideation-api';
import { InsightsAPI, createInsightsAPI } from './modules/insights-api';
import { AppUpdateAPI, createAppUpdateAPI } from './app-update-api';
<<<<<<< HEAD
import { UnityAPI, createUnityAPI } from './unity-api';
import { CSharpLspAPI, createCSharpLspAPI } from './csharp-lsp-api';
=======
import { GitHubAPI, createGitHubAPI } from './modules/github-api';
import { DebugAPI, createDebugAPI } from './modules/debug-api';
>>>>>>> AndyMik90/develop

export interface ElectronAPI extends
  ProjectAPI,
  TerminalAPI,
  TaskAPI,
  SettingsAPI,
  FileAPI,
  AgentAPI,
  IdeationAPI,
  InsightsAPI,
  AppUpdateAPI,
<<<<<<< HEAD
  UnityAPI,
  CSharpLspAPI {}
=======
  DebugAPI {
  github: GitHubAPI;
}
>>>>>>> AndyMik90/develop

export const createElectronAPI = (): ElectronAPI => ({
  ...createProjectAPI(),
  ...createTerminalAPI(),
  ...createTaskAPI(),
  ...createSettingsAPI(),
  ...createFileAPI(),
  ...createAgentAPI(),
  ...createIdeationAPI(),
  ...createInsightsAPI(),
  ...createAppUpdateAPI(),
<<<<<<< HEAD
  ...createUnityAPI(),
  ...createCSharpLspAPI()
=======
  ...createDebugAPI(),
  github: createGitHubAPI()
>>>>>>> AndyMik90/develop
});

// Export individual API creators for potential use in tests or specialized contexts
export {
  createProjectAPI,
  createTerminalAPI,
  createTaskAPI,
  createSettingsAPI,
  createFileAPI,
  createAgentAPI,
  createIdeationAPI,
  createInsightsAPI,
  createAppUpdateAPI,
<<<<<<< HEAD
  createUnityAPI,
  createCSharpLspAPI
=======
  createGitHubAPI,
  createDebugAPI
>>>>>>> AndyMik90/develop
};

export type {
  ProjectAPI,
  TerminalAPI,
  TaskAPI,
  SettingsAPI,
  FileAPI,
  AgentAPI,
  IdeationAPI,
  InsightsAPI,
  AppUpdateAPI,
<<<<<<< HEAD
  UnityAPI,
  CSharpLspAPI
=======
  GitHubAPI,
  DebugAPI
>>>>>>> AndyMik90/develop
};
