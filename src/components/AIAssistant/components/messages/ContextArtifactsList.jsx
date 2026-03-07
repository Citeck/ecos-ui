import React from 'react';
import { Icon } from '../../../common';
import { getContextArtifactIcon } from '../../constants';
import { getTextByLocale } from '../../../../helpers/util';

const getArtifactUrl = (ref) => {
  if (!ref) return null;
  return `/v2/dashboard?recordRef=${encodeURIComponent(ref)}`;
};

/**
 * Component for rendering a list of context artifacts found by the AI assistant.
 * Similar to ArtifactsList but for auto-discovered related artifacts.
 *
 * @param {Object} props
 * @param {Array} props.contextArtifacts - List of context artifact objects ({ ref, displayName, type })
 */
const ContextArtifactsList = ({ contextArtifacts }) => {
  if (!contextArtifacts || contextArtifacts.length === 0) return null;

  return (
    <div className="ai-assistant-chat__context-artifacts">
      <div className="ai-assistant-chat__context-artifacts-header">
        <Icon className="fa fa-link" />
        <span>Связанные артефакты:</span>
      </div>
      <div className="ai-assistant-chat__context-artifacts-list">
        {contextArtifacts.map((artifact) => {
          const url = getArtifactUrl(artifact.ref);
          const displayText = getTextByLocale(artifact.displayName) || artifact.ref;
          return (
            <div key={artifact.ref || artifact.displayName} className="ai-assistant-chat__context-artifact-item">
              <Icon className={`fa ${getContextArtifactIcon(artifact.type)}`} />
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-assistant-chat__context-artifact-link"
                >
                  {displayText}
                </a>
              ) : (
                <span className="ai-assistant-chat__context-artifact-link">{displayText}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContextArtifactsList;
