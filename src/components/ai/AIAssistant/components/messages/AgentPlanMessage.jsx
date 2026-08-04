import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { AGENT_STATUSES } from '../../types';

import ArtifactsList from './ArtifactsList';
import ContextArtifactsList from './ContextArtifactsList';
import MessageActions from './MessageActions';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

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
 * @param {boolean} props.actionsDisabled - Whether the buttons must be locked: this gate is no longer
 *   live, or a request is in flight (see MessageList)
 * @param {boolean} props.actionsStale - Whether this gate is no longer live, without the in-flight
 *   freeze folded in; decides whether the hint is shown and whether the buttons are painted retired
 */
const AgentPlanMessage = ({
  message,
  markdownComponents,
  onActionClick,
  actionsDisabled = false,
  actionsFrozen = false,
  actionsStale = false
}) => {
  const { messageData, text } = message;

  if (!messageData) return null;

  const agentStatus = messageData.agentStatus;
  const content = messageData.message || text;
  const hintKey = HINT_KEYS[agentStatus];
  const hint = hintKey ? t(hintKey) : null;

  // The hint tells the user what the gate is waiting for, so it only makes sense while the gate is
  // live. A gate is no longer live once its own decision has been taken (`actionsResolved`) or once
  // the dialog has moved past it (`actionsStale`, see MessageList). Without this check the hint
  // «Подтвердите план...» reappeared under the card right after the plan had been rejected.
  // Staleness, not `actionsDisabled`: an unrelated request in flight freezes the buttons but leaves
  // the gate waiting, and blinking the hint away for the length of that round trip would claim
  // otherwise.
  const isGateLive = !actionsStale && !messageData.actionsResolved;

  return (
    <div className="ai-assistant-chat__agent-plan">
      {content && (
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </Markdown>
      )}

      {agentStatus === AGENT_STATUSES.COMPLETED && <ArtifactsList artifacts={messageData.artifacts} />}

      {(agentStatus === AGENT_STATUSES.WAITING_PLAN_APPROVAL || agentStatus === AGENT_STATUSES.COMPLETED) && (
        <ContextArtifactsList contextArtifacts={messageData.contextArtifacts} />
      )}

      {agentStatus === AGENT_STATUSES.FAILED && messageData.error && (
        <div className="ai-assistant-chat__agent-error">
          <Icon className="fa fa-exclamation-circle" />
          <span>{messageData.error}</span>
        </div>
      )}

      <MessageActions
        actions={messageData.actions}
        messageId={message.id}
        onActionClick={onActionClick}
        disabled={actionsDisabled}
        frozen={actionsFrozen}
        stale={actionsStale}
        resolvedFileTempRefs={messageData.resolvedFileTempRefs}
      />

      {hint && isGateLive && !messageData.actions?.length && <div className="ai-assistant-chat__agent-hint">{hint}</div>}
    </div>
  );
};

export default AgentPlanMessage;
