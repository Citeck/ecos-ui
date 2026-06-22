/**
 * CodeDiffPreview Component
 * Compact code diff preview for inline AI results
 * Uses react-diff-viewer-continued for diff visualization
 */

import React, { useMemo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { t } from '@/helpers/export/util';

export interface CodeDiffPreviewProps {
  original?: string;
  generated?: string;
  language?: string;
  contextType?: string;
}

const CodeDiffPreview: React.FC<CodeDiffPreviewProps> = ({
  original = '',
  generated = ''
}) => {
  // Determine if this is new code or modification
  const isNewCode = !original || original.trim() === '';
  const hasChanges = original !== generated;

  // Light theme styles optimized for inline display
  const diffStyles = useMemo(() => ({
    variables: {
      light: {
        diffViewerBackground: '#f8f9fa',
        diffViewerColor: '#24292e',
        addedBackground: '#e6ffec',
        addedColor: '#22863a',
        removedBackground: '#ffeef0',
        removedColor: '#cb2431',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#ffdce0',
        gutterBackground: '#f6f8fa',
        gutterBackgroundDark: '#f0f2f4',
        codeFoldBackground: '#f1f8ff',
        codeFoldGutterBackground: '#dbedff',
        codeFoldContentColor: '#0366d6',
        emptyLineBackground: '#f8f9fa'
      }
    },
    line: {
      padding: '2px 8px',
      fontSize: '12px',
      lineHeight: '18px'
    },
    gutter: {
      minWidth: '32px',
      padding: '0 6px',
      fontSize: '11px'
    },
    contentText: {
      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, monospace',
      fontSize: '12px',
      lineHeight: '18px'
    },
    diffContainer: {
      borderRadius: '4px',
      overflow: 'hidden'
    }
  }), []);

  // For new code without original, show clean preview
  if (isNewCode) {
    return (
      <div className="ai-code-diff-preview ai-code-diff-preview--new">
        <div className="ai-code-diff-preview__code">
          <pre><code>{generated}</code></pre>
        </div>
      </div>
    );
  }

  // No changes - show original
  if (!hasChanges) {
    return (
      <div className="ai-code-diff-preview ai-code-diff-preview--unchanged">
        <div className="ai-code-diff-preview__message">
          {t('ai-code-diff.no-changes', 'No changes')}
        </div>
      </div>
    );
  }

  // Diff view for modifications
  return (
    <div className="ai-code-diff-preview">
      <div className="ai-code-diff-preview__diff">
        <ReactDiffViewer
          oldValue={original}
          newValue={generated}
          splitView={true}
          showDiffOnly={false}
          compareMethod={DiffMethod.WORDS}
          hideLineNumbers={false}
          useDarkTheme={false}
          leftTitle={t('ai-code-diff.original', 'Original')}
          rightTitle={t('ai-code-diff.modified', 'Modified')}
          styles={diffStyles}
        />
      </div>
    </div>
  );
};

export default CodeDiffPreview;
