import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DiffViewer from '../../DiffViewer';

/**
 * Text diff message component
 * @param {Object} props
 * @param {string} props.text - Description text
 * @param {Object} props.messageData - Diff data (originalPlainText, modifiedPlainText, attributeName)
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onApplyChanges - Apply changes handler
 * @param {boolean} props.isApplying - Whether changes are being applied
 */
const TextDiffMessage = ({
  text,
  messageData,
  markdownComponents,
  onApplyChanges,
  isApplying
}) => {
  if (!messageData) return null;

  return (
    <div className="ai-assistant-chat__text-diff-preview">
      <div className="ai-assistant-chat__text-diff-description">
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </Markdown>
      </div>
      <DiffViewer
        original={messageData.originalPlainText || ''}
        modified={messageData.modifiedPlainText || ''}
        attributeName={messageData.attributeName}
        onApplyChanges={onApplyChanges}
        isApplying={isApplying}
      />
    </div>
  );
};

export default TextDiffMessage;
