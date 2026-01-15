<<<<<<<< HEAD:apps/frontend/src/renderer/components/GitLabIssues.tsx
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "../stores/project-store";
import { useTaskStore } from "../stores/task-store";
import { useGitLabIssues, useGitLabInvestigation, useIssueFiltering } from "./gitlab-issues/hooks";
========
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useProjectStore } from '../stores/project-store';
import { useTaskStore } from '../stores/task-store';
import { useGitHubIssues, useGitHubInvestigation, useIssueFiltering, useAutoFix } from './github-issues/hooks';
import { useAnalyzePreview } from './github-issues/hooks/useAnalyzePreview';
>>>>>>>> develop2:apps/frontend/src/renderer/components/GitHubIssues.tsx
import {
  NotConnectedState,
  EmptyState,
  IssueListHeader,
  IssueList,
  IssueDetail,
  InvestigationDialog,
<<<<<<<< HEAD:apps/frontend/src/renderer/components/GitLabIssues.tsx
} from "./gitlab-issues/components";
import type { GitLabIssue } from "../../shared/types";
import type { GitLabIssuesProps } from "./gitlab-issues/types";
========
  BatchReviewWizard
} from './github-issues/components';
import { GitHubSetupModal } from './GitHubSetupModal';
import type { GitHubIssue } from '../../shared/types';
import type { GitHubIssuesProps } from './github-issues/types';
>>>>>>>> develop2:apps/frontend/src/renderer/components/GitHubIssues.tsx

export function GitLabIssues({ onOpenSettings, onNavigateToTask }: GitLabIssuesProps) {
  const { t } = useTranslation("gitlab");
  const projects = useProjectStore((state) => state.projects);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const tasks = useTaskStore((state) => state.tasks);

  const {
    syncStatus,
    isLoading,
    error,
    selectedIssueIid,
    selectedIssue,
    filterState,
    selectIssue,
    getFilteredIssues,
    getOpenIssuesCount,
    handleRefresh,
    handleFilterChange,
  } = useGitLabIssues(selectedProject?.id);

  const {
    investigationStatus,
    lastInvestigationResult,
    startInvestigation,
    resetInvestigationStatus,
  } = useGitLabInvestigation(selectedProject?.id);

  const { searchQuery, setSearchQuery, filteredIssues } = useIssueFiltering(getFilteredIssues());

  const {
    config: autoFixConfig,
    getQueueItem: getAutoFixQueueItem,
    isBatchRunning,
    batchProgress,
    toggleAutoFix,
    checkForNewIssues,
  } = useAutoFix(selectedProject?.id);

  // Analyze & Group Issues (proactive workflow)
  const {
    isWizardOpen,
    isAnalyzing,
    isApproving,
    analysisProgress,
    analysisResult,
    analysisError,
    openWizard,
    closeWizard,
    startAnalysis,
    approveBatches,
  } = useAnalyzePreview({ projectId: selectedProject?.id || '' });

  const [showInvestigateDialog, setShowInvestigateDialog] = useState(false);
<<<<<<<< HEAD:apps/frontend/src/renderer/components/GitLabIssues.tsx
  const [selectedIssueForInvestigation, setSelectedIssueForInvestigation] =
    useState<GitLabIssue | null>(null);
========
  const [selectedIssueForInvestigation, setSelectedIssueForInvestigation] = useState<GitHubIssue | null>(null);
  const [showGitHubSetup, setShowGitHubSetup] = useState(false);

  // Show GitHub setup modal when module is not installed
  useEffect(() => {
    if (analysisError?.includes('GitHub automation module not installed')) {
      setShowGitHubSetup(true);
    }
  }, [analysisError]);
>>>>>>>> develop2:apps/frontend/src/renderer/components/GitHubIssues.tsx

  // Build a map of GitLab issue IIDs to task IDs for quick lookup
  const issueToTaskMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const task of tasks) {
      if (task.metadata?.gitlabIssueIid) {
        map.set(task.metadata.gitlabIssueIid, task.specId || task.id);
      }
    }
    return map;
  }, [tasks]);

<<<<<<<< HEAD:apps/frontend/src/renderer/components/GitLabIssues.tsx
  const handleInvestigate = useCallback((issue: GitLabIssue) => {
========
  // Enhanced refresh that also checks for new auto-fix issues
  const handleRefreshWithAutoFix = useCallback(() => {
    handleRefresh();
    // Also check for new auto-fix issues if enabled
    if (autoFixConfig?.enabled) {
      checkForNewIssues();
    }
  }, [handleRefresh, autoFixConfig?.enabled, checkForNewIssues]);

  const handleInvestigate = useCallback((issue: GitHubIssue) => {
>>>>>>>> develop2:apps/frontend/src/renderer/components/GitHubIssues.tsx
    setSelectedIssueForInvestigation(issue);
    setShowInvestigateDialog(true);
  }, []);

  const handleStartInvestigation = useCallback(
    (selectedNoteIds: number[]) => {
      if (selectedIssueForInvestigation) {
        startInvestigation(selectedIssueForInvestigation, selectedNoteIds);
      }
    },
    [selectedIssueForInvestigation, startInvestigation]
  );

  const handleCloseDialog = useCallback(() => {
    setShowInvestigateDialog(false);
    resetInvestigationStatus();
  }, [resetInvestigationStatus]);

  // Not connected state
  if (!syncStatus?.connected) {
    return <NotConnectedState error={syncStatus?.error || null} onOpenSettings={onOpenSettings} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <IssueListHeader
        projectPath={syncStatus.projectPathWithNamespace ?? ""}
        openIssuesCount={getOpenIssuesCount()}
        isLoading={isLoading}
        searchQuery={searchQuery}
        filterState={filterState}
        onSearchChange={setSearchQuery}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefreshWithAutoFix}
        autoFixEnabled={autoFixConfig?.enabled}
        autoFixRunning={isBatchRunning}
        autoFixProcessing={batchProgress?.totalIssues}
        onAutoFixToggle={toggleAutoFix}
        onAnalyzeAndGroup={openWizard}
        isAnalyzing={isAnalyzing}
      />

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Issue List */}
        <div className="w-1/2 border-r border-border flex flex-col">
          <IssueList
            issues={filteredIssues}
            selectedIssueIid={selectedIssueIid}
            isLoading={isLoading}
            error={error}
            onSelectIssue={selectIssue}
            onInvestigate={handleInvestigate}
          />
        </div>

        {/* Issue Detail */}
        <div className="w-1/2 flex flex-col">
          {selectedIssue ? (
            <IssueDetail
              issue={selectedIssue}
              onInvestigate={() => handleInvestigate(selectedIssue)}
              investigationResult={
                lastInvestigationResult?.issueIid === selectedIssue.iid
                  ? lastInvestigationResult
                  : null
              }
              linkedTaskId={issueToTaskMap.get(selectedIssue.iid)}
              onViewTask={onNavigateToTask}
              projectId={selectedProject?.id}
              autoFixConfig={autoFixConfig}
              autoFixQueueItem={getAutoFixQueueItem(selectedIssue.number)}
            />
          ) : (
            <EmptyState message={t("empty.selectIssue")} />
          )}
        </div>
      </div>

      {/* Investigation Dialog */}
      <InvestigationDialog
        open={showInvestigateDialog}
        onOpenChange={setShowInvestigateDialog}
        selectedIssue={selectedIssueForInvestigation}
        investigationStatus={investigationStatus}
        onStartInvestigation={handleStartInvestigation}
        onClose={handleCloseDialog}
        projectId={selectedProject?.id}
      />

      {/* Batch Review Wizard (Proactive workflow) */}
      <BatchReviewWizard
        isOpen={isWizardOpen}
        onClose={closeWizard}
        projectId={selectedProject?.id || ''}
        onStartAnalysis={startAnalysis}
        onApproveBatches={approveBatches}
        analysisProgress={analysisProgress}
        analysisResult={analysisResult}
        analysisError={analysisError}
        isAnalyzing={isAnalyzing}
        isApproving={isApproving}
      />

      {/* GitHub Setup Modal - shown when GitHub module is not configured */}
      {selectedProject && (
        <GitHubSetupModal
          open={showGitHubSetup}
          onOpenChange={setShowGitHubSetup}
          project={selectedProject}
          onComplete={() => {
            setShowGitHubSetup(false);
            // Retry the analysis after setup is complete
            openWizard();
            startAnalysis();
          }}
          onSkip={() => setShowGitHubSetup(false)}
        />
      )}
    </div>
  );
}
