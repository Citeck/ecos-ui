import React from 'react';

import { externalLinkProps } from '../ChatMarkdownLink';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

/**
 * Shared component for rendering a list of generated artifacts.
 * Used by BusinessAppMessage and AgentPlanMessage.
 *
 * @param {Object} props
 * @param {Array} props.artifacts - List of artifact objects ({ name, url, type: { displayName, icon } })
 */
const ArtifactsList = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  return (
    <div className="ai-assistant-chat__artifacts">
      <div className="ai-assistant-chat__artifacts-header">
        <Icon className="fa fa-check-circle" />
        <span>{t('ai-assistant.artifacts.title')}</span>
      </div>
      <div className="ai-assistant-chat__artifacts-list">
        {artifacts.map((artifact, index) => (
          <div key={index} className="ai-assistant-chat__artifact-item">
            <Icon className={`fa ${artifact.type?.icon || ''}`} />
            <a href={artifact.url} className="ai-assistant-chat__artifact-link" {...externalLinkProps(artifact.url)}>
              {artifact.name}
            </a>
            <span className="ai-assistant-chat__artifact-type">{artifact.type?.displayName || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtifactsList;
