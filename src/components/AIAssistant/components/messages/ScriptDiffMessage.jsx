import React from 'react';
import ScriptDiffViewer from '../../ScriptDiffViewer';

/**
 * Script diff message component
 * @param {Object} props
 * @param {string} props.text - Explanation text
 * @param {Object} props.messageData - Diff data (originalScript, modifiedScript, contextType)
 * @param {Function} props.onApplyChanges - Apply changes handler
 * @param {boolean} props.isApplying - Whether changes are being applied
 */
const ScriptDiffMessage = ({
  text,
  messageData,
  onApplyChanges,
  isApplying
}) => {
  if (!messageData) return null;

  return (
    <div className="ai-assistant-chat__script-diff-preview">
      <ScriptDiffViewer
        original={messageData.originalScript || ''}
        modified={messageData.modifiedScript || ''}
        contextType={messageData.contextType}
        explanation={text}
        onApplyChanges={onApplyChanges}
        isApplying={isApplying}
      />
    </div>
  );
};

export default ScriptDiffMessage;
