import React, { useMemo } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import Markdown from "react-markdown";
import { Icon } from "../common";
import { t } from "@/helpers/export/util.ts";
import { getScriptContextLabel } from "./constants";

const ScriptDiffViewer = ({
  original,
  modified,
  contextType,
  explanation,
  onApplyChanges,
  isApplying = false,
}) => {
  // Normalize content checks using .trim() for consistent handling of whitespace
  const hasModified = modified && modified.trim() !== '';
  const hasOriginal = original && original.trim() !== '';
  const hasExplanation = explanation && explanation.trim() !== '';

  // Return null only if there's nothing to display
  if (!hasModified && !hasOriginal && !hasExplanation) {
    return null;
  }

  // Explanation-only mode: show original script + explanation without Apply button
  const isExplanationOnly = !hasModified && hasOriginal;

  // Determine if this is a new script (no original) or modification
  const isNewScript = !hasOriginal;
  const hasChanges = original !== modified;

  // Use unified view for new scripts, split view for modifications
  const useSplitView = !isNewScript && hasChanges;

  // Light theme styles - more readable and professional
  const diffStyles = useMemo(() => ({
    variables: {
      light: {
        diffViewerBackground: '#fafbfc',
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
        emptyLineBackground: '#fafbfc',
        highlightBackground: '#fffbdd',
        highlightGutterBackground: '#fff5b1',
      }
    },
    line: {
      padding: '4px 8px',
      '&:hover': {
        background: '#f1f8ff',
      }
    },
    gutter: {
      minWidth: '40px',
      padding: '0 8px',
      textAlign: 'right',
      color: '#6a737d',
      borderRight: '1px solid #e1e4e8',
    },
    contentText: {
      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: '13px',
      lineHeight: '20px',
    },
    titleBlock: {
      padding: '8px 12px',
      background: '#f6f8fa',
      borderBottom: '1px solid #e1e4e8',
      fontWeight: '600',
      fontSize: '12px',
      color: '#586069',
    },
    splitView: {
      '& > div': {
        borderRight: '1px solid #e1e4e8',
      }
    },
    diffContainer: {
      borderRadius: '6px',
      overflow: 'hidden',
    }
  }), []);

  return (
    <div className="ai-assistant-chat-script-diff-viewer">
      <div className="ai-assistant-chat-script-diff-viewer__header">
        <Icon className="fa fa-code" />
        <span>{getScriptContextLabel(contextType)}</span>
        {isNewScript && (
          <span className="ai-assistant-chat-script-diff-viewer__badge ai-assistant-chat-script-diff-viewer__badge--new">
            {t('script-diff.new-script', 'New')}
          </span>
        )}
      </div>

      {explanation && (
        <div className="ai-assistant-chat-script-diff-viewer__explanation">
          <Markdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              )
            }}
          >
            {explanation}
          </Markdown>
        </div>
      )}

      <div className="ai-assistant-chat-script-diff-viewer__content">
        {isExplanationOnly ? (
          // Explanation-only mode: show original script as read-only
          <div className="ai-assistant-chat-script-diff-viewer__code-preview">
            <pre><code>{original}</code></pre>
          </div>
        ) : isNewScript ? (
          // For new scripts, show clean code preview without diff
          <div className="ai-assistant-chat-script-diff-viewer__code-preview">
            <pre><code>{modified}</code></pre>
          </div>
        ) : (
          // Diff view for modifications
          <ReactDiffViewer
            oldValue={original}
            newValue={modified}
            splitView={useSplitView}
            showDiffOnly={false}
            compareMethod={DiffMethod.WORDS}
            hideLineNumbers={false}
            useDarkTheme={false}
            leftTitle={t('script-diff.original', 'Original')}
            rightTitle={t('script-diff.modified', 'Modified')}
            styles={diffStyles}
          />
        )}
      </div>

      {onApplyChanges && !isExplanationOnly && (
        <div className="ai-assistant-chat-script-diff-viewer__actions">
          <button
            className="ai-assistant-chat__action-button ai-assistant-chat__action-button--apply"
            onClick={onApplyChanges}
            disabled={isApplying}
            title={t('script-diff.apply-changes', 'Apply script changes')}
          >
            {isApplying ? (
              <>
                <Icon className="fa fa-spinner fa-spin" />
                {t('script-diff.applying', 'Applying...')}
              </>
            ) : (
              <>
                <Icon className="fa fa-check" />
                {t('script-diff.apply', 'Apply Changes')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScriptDiffViewer;
