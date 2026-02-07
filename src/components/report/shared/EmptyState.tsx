'use client';

import { type ReactNode } from 'react';
import { useThemeStyles } from '../core/ThemeContext';
import {
  SearchIllustration,
  FolderIllustration,
  ChainBreakIllustration,
  DocumentsIllustration,
  NetworkIllustration,
  LightbulbIllustration,
  AnalysisIllustration,
  UsersIllustration,
} from './Illustrations';

export type EmptyStateType =
  | 'search'        // No search results
  | 'folder'        // No entities / empty folder
  | 'chain'         // No contradictions / broken chain
  | 'documents'     // No findings
  | 'network'       // No sources
  | 'lightbulb'     // No perspectives
  | 'analysis'      // No analysis data
  | 'users';        // No entities (people)

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description?: string;
  action?: ReactNode;
}

const illustrations: Record<EmptyStateType, () => ReactNode> = {
  search: () => <SearchIllustration />,
  folder: () => <FolderIllustration />,
  chain: () => <ChainBreakIllustration />,
  documents: () => <DocumentsIllustration />,
  network: () => <NetworkIllustration />,
  lightbulb: () => <LightbulbIllustration />,
  analysis: () => <AnalysisIllustration />,
  users: () => <UsersIllustration />,
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const styles = useThemeStyles();
  const Illustration = illustrations[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="mb-4 opacity-80">
        <Illustration />
      </div>
      <h3 className={`text-sm font-medium mb-1 ${styles.text}`}>{title}</h3>
      {description && (
        <p className={`text-xs text-center max-w-xs ${styles.textMuted}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
