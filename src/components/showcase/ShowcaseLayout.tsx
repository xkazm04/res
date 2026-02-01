'use client';

import { useState, useCallback, useEffect } from 'react';
import { TemplateSelector } from './TemplateSelector';
import { VideoPreview } from './VideoPreview';
import { DataInspector } from './DataInspector';
import { ActionPanel } from './ActionPanel';
import {
  TemplateType,
  getShowcaseMock,
  getOrderedShowcaseMocks,
} from '@/src/lib/videoShowcaseMockData';

export type VideoFormat = 'standard' | 'mobile';
export type VideoTheme = 'radar' | 'swiss';

export function ShowcaseLayout() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('understanding');
  const [format, setFormat] = useState<VideoFormat>('standard');
  const [theme, setTheme] = useState<VideoTheme>('radar');
  const [showInspector, setShowInspector] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);

  const currentMock = getShowcaseMock(selectedTemplate);

  // Keyboard shortcuts
  useEffect(() => {
    const orderedMocks = getOrderedShowcaseMocks();

    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'f':
          setFormat(f => f === 'standard' ? 'mobile' : 'standard');
          break;
        case 't':
          setTheme(t => t === 'radar' ? 'swiss' : 'radar');
          break;
        case 'i':
          setShowInspector(s => !s);
          break;
        case 'ArrowRight':
          // Next template
          const currentIndex = orderedMocks.findIndex(m => m.templateType === selectedTemplate);
          const nextIndex = (currentIndex + 1) % orderedMocks.length;
          setSelectedTemplate(orderedMocks[nextIndex].templateType);
          break;
        case 'ArrowLeft':
          // Previous template
          const currIdx = orderedMocks.findIndex(m => m.templateType === selectedTemplate);
          const prevIndex = currIdx === 0 ? orderedMocks.length - 1 : currIdx - 1;
          setSelectedTemplate(orderedMocks[prevIndex].templateType);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTemplate]);

  const handleFrameChange = useCallback((frame: number) => {
    setCurrentFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Video Showcase</h1>
            <p className="text-sm text-slate-400 mt-1">
              Template-specific video output iteration
            </p>
          </div>

          {/* Format & Theme Controls */}
          <div className="flex items-center gap-4">
            {/* Format Toggle */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setFormat('standard')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  format === 'standard'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => setFormat('mobile')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  format === 'mobile'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                9:16
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTheme('radar')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  theme === 'radar'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Radar
              </button>
              <button
                onClick={() => setTheme('swiss')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  theme === 'swiss'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Swiss
              </button>
            </div>

            {/* Inspector Toggle */}
            <button
              onClick={() => setShowInspector(!showInspector)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                showInspector
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showInspector ? 'Hide' : 'Show'} Data
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">F</kbd> Format</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">T</kbd> Theme</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">I</kbd> Inspector</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">→</kbd> Templates</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Space</kbd> Play/Pause</span>
        </div>
      </header>

      {/* Template Selector */}
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />

      {/* Main Content */}
      <main className="flex">
        {/* Video Preview - Centered with Action Panel */}
        <div className={`flex-1 flex items-start justify-center p-8 gap-6 ${showInspector ? '' : ''}`}>
          <VideoPreview
            mock={currentMock}
            format={format}
            theme={theme}
            onFrameChange={handleFrameChange}
          />

          {/* Action Panel - Right of Video */}
          <ActionPanel
            templateType={selectedTemplate}
            isVideoReady={true}
          />
        </div>

        {/* Data Inspector - Right Sidebar */}
        {showInspector && currentMock && (
          <div className="w-96 border-l border-slate-800 bg-slate-900/50 overflow-y-auto max-h-[calc(100vh-120px)]">
            <DataInspector
              mock={currentMock}
              currentFrame={currentFrame}
            />
          </div>
        )}
      </main>
    </div>
  );
}
