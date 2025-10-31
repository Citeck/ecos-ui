import React from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { getMLValue } from '@/helpers/util';
import { Icon } from "../common";

const DiffViewer = ({
  original,
  modified,
  attributeName,
  onApplyChanges,
  isApplying = false,
}) => {

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
          leftTitle={getMLValue(attributeName) + " (до)"}
          rightTitle={getMLValue(attributeName) + " (после)"}
        />
      </div>

      {onApplyChanges && (
        <div className="ai-assistant-chat-diff-viewer__actions">
          <button
            className="ai-assistant-chat__action-button ai-assistant-chat__action-button--apply"
            onClick={onApplyChanges}
            disabled={isApplying}
            title="Применить изменения"
          >
            {isApplying ? (
              <>
                <Icon className="fa fa-spinner fa-spin" />
                Применение...
              </>
            ) : (
              <>
                <Icon className="fa fa-check" />
                Применить изменения
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
