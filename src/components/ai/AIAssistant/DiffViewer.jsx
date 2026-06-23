import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';
import { getMLValue } from '@/helpers/util';

const DiffViewer = ({ original, modified, attributeName, onApplyChanges, isApplying = false }) => {
  if (!original && !modified) {
    return null;
  }

  return (
    <div className="ai-assistant-chat-diff-viewer">
      <div className="ai-assistant-chat-diff-viewer__content">
        <ReactDiffViewer
          oldValue={original}
          newValue={modified}
          splitView={true}
          showDiffOnly={false}
          compareMethod={DiffMethod.WORDS}
          hideLineNumbers={true}
          useDarkTheme={false}
          leftTitle={getMLValue(attributeName) + ' ' + t('ai-assistant.diff.before')}
          rightTitle={getMLValue(attributeName) + ' ' + t('ai-assistant.diff.after')}
        />
      </div>

      {onApplyChanges && (
        <div className="ai-assistant-chat-diff-viewer__actions">
          <button
            className="ai-assistant-chat__action-button ai-assistant-chat__action-button--apply"
            onClick={onApplyChanges}
            disabled={isApplying}
            title={t('ai-assistant.diff.apply')}
          >
            {isApplying ? (
              <>
                <Icon className="fa fa-spinner fa-spin" />
                {t('ai-assistant.diff.applying')}
              </>
            ) : (
              <>
                <Icon className="fa fa-check" />
                {t('ai-assistant.diff.apply')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
