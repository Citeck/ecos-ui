import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { t } from '@/helpers/export/util';
import { Icon } from '../../../common';
import { AGENT_STATUSES } from '../../types';
import ArtifactsList from './ArtifactsList';
import ContextArtifactsList from './ContextArtifactsList';
import MessageActions from './MessageActions';

const HINT_KEYS = {
  [AGENT_STATUSES.WAITING_PLAN_APPROVAL]: 'ai-assistant.agent-plan.hint-waiting-plan',
  [AGENT_STATUSES.WAITING_STEP_APPROVAL]: 'ai-assistant.agent-plan.hint-waiting-step',
  [AGENT_STATUSES.FAILED]: 'ai-assistant.agent-plan.hint-failed'
};

/**
 * Agent plan message component
 * Displays agent plan content for WAITING_PLAN_APPROVAL, WAITING_STEP_APPROVAL, COMPLETED, and FAILED states.
 * Renders markdown content (including mermaid diagrams) and shows contextual hints.
 *
 * @param {Object} props
 * @param {Object} props.message - Full message object with messageData containing agentStatus and message
 * @param {Object} props.markdownComponents - Markdown component overrides
 */
const AgentPlanMessage = ({ message, markdownComponents, onActionClick }) => {
  const { messageData, text } = message;

  if (!messageData) return null;

  const agentStatus = messageData.agentStatus;
  const content = messageData.message || text;
  const hintKey = HINT_KEYS[agentStatus];
  const hint = hintKey ? t(hintKey) : null;

  return (
    <div className="ai-assistant-chat__agent-plan">
      {content && (
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </Markdown>
      )}

      {agentStatus === AGENT_STATUSES.COMPLETED && (
        <ArtifactsList artifacts={messageData.artifacts} />
      )}

      {(agentStatus === AGENT_STATUSES.WAITING_PLAN_APPROVAL || agentStatus === AGENT_STATUSES.COMPLETED) && (
        <ContextArtifactsList contextArtifacts={messageData.contextArtifacts} />
      )}

      {agentStatus === AGENT_STATUSES.FAILED && messageData.error && (
        <div className="ai-assistant-chat__agent-error">
          <Icon className="fa fa-exclamation-circle" />
          <span>{messageData.error}</span>
        </div>
      )}

      <MessageActions actions={messageData.actions} onActionClick={onActionClick} />

      {hint && !messageData.actions?.length && (
        <div className="ai-assistant-chat__agent-hint">
          {hint}
        </div>
      )}
    </div>
  );
};

export default AgentPlanMessage;
