import classNames from 'classnames';
import React from 'react';

import { AGENT_TOOL_STEP_PROGRESS_TYPE } from '../../constants';

import ToolStepProgress from './ToolStepProgress';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

const STEP_STATUS_ICONS = {
  COMPLETED: { icon: 'fa-check-circle', className: 'agent-step--completed' },
  IN_PROGRESS: { icon: 'fa-spinner', className: 'agent-step--in-progress', spin: true },
  FAILED: { icon: 'fa-times-circle', className: 'agent-step--failed' },
  SKIPPED: { icon: 'fa-arrow-circle-right', className: 'agent-step--skipped' },
  PENDING: { icon: 'fa-circle-o', className: 'agent-step--pending' }
};

/**
 * Renders a single step in the agent execution checklist
 * Supports expandable details (output, error) and execution time display
 */
const StepItem = ({ step, failed = false }) => {
  const statusConfig = STEP_STATUS_ICONS[step.status] || STEP_STATUS_ICONS.PENDING;

  return (
    <div className={classNames('ai-assistant-chat__agent-step', statusConfig.className)}>
      <div className="ai-assistant-chat__agent-step-header">
        {/* A step left IN_PROGRESS by a dead turn must stop spinning with the rest of the card */}
        <Icon className={classNames('fa', statusConfig.icon, { 'fa-spin': statusConfig.spin && !failed })} />
        <span className="ai-assistant-chat__agent-step-description">{step.description}</span>
        {step.executionTime && step.status === 'COMPLETED' && (
          <span className="ai-assistant-chat__agent-step-time">{step.executionTime}</span>
        )}
      </div>

      {/* Error message for failed steps */}
      {step.status === 'FAILED' && step.error && (
        <div className="ai-assistant-chat__agent-step-error">
          <Icon className="fa fa-exclamation-triangle" />
          <span>{step.error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Fragments of the planning facts line (contract section 2 of COREDEV-484): each fragment is
 * rendered only when the backend actually sent the fact, so an old backend without
 * `businessApp.planning` yields an empty list and the line is not drawn at all.
 */
const planningFacts = planning => {
  if (!planning) return [];

  const facts = [];
  if (planning.specRead) {
    facts.push(t('ai-assistant.agent-progress.planning-spec-read'));
  }
  // `0` is a fact too ("spec read, nothing extracted"); only an absent count is skipped
  if (planning.requirementCount != null) {
    facts.push(t('ai-assistant.agent-progress.planning-requirements', { count: planning.requirementCount }));
  }
  if (Array.isArray(planning.requestedKinds) && planning.requestedKinds.length > 0) {
    facts.push(t('ai-assistant.agent-progress.planning-kinds', { kinds: planning.requestedKinds.join(', ') }));
  }
  return facts;
};

/**
 * "Attempt N of M[: reason]" — only from the second planner attempt on; the first attempt is the
 * normal case and gets no line.
 */
const planningAttempt = (currentAttempt, maxAttempts, retryReason) => {
  if (!(currentAttempt > 1 && maxAttempts)) return null;

  const attempt = t('ai-assistant.agent-progress.planning-attempt', { current: currentAttempt, total: maxAttempts });
  return retryReason ? `${attempt}: ${retryReason}` : attempt;
};

/**
 * Agent progress message component
 * Displays planning spinner or execution progress with step checklist.
 *
 * @param {Object} props
 * @param {Object} props.message - Full message object with messageData containing progress info
 */
const AgentProgressMessage = ({ message }) => {
  const { messageData } = message;

  if (!messageData) return null;

  const progressType = messageData.type;

  // A dead turn stamps `messageData.error` (`handlePollingError`). The card renders only from
  // `messageData`, so without honouring the stamp it keeps spinning and showing a filled bar for a
  // request that already failed — the very symptom of D-B-7, on the most common (agent) path.
  const failed = !!messageData.error;
  // A cancelled turn is just as dead, but `cancelRequest` / `handlePollingCancelled` flag the
  // message, not `messageData`, so the card has to look at both. Otherwise «Отменить» left the
  // spinner turning and the planner facts and attempt line on screen for a request the user had
  // stopped (COREDEV-484, A6).
  const cancelled = !failed && !!message.isCancelled;
  const dead = failed || cancelled;
  const deadIcon = failed ? 'fa fa-exclamation-triangle' : 'fa fa-ban';
  const deadTitle = failed ? t('ai-assistant.chat.request-failed') : t('ai-assistant.chat.cancelled-title');
  const deadModifiers = {
    'ai-assistant-chat__agent-progress--failed': failed,
    'ai-assistant-chat__agent-progress--cancelled': cancelled
  };

  // Config-agent tool-loop feed (contract #2) — cumulative tool-step ribbon
  if (progressType === AGENT_TOOL_STEP_PROGRESS_TYPE) {
    return <ToolStepProgress message={message} />;
  }

  // Planning state - show spinner plus what the planner already knows (COREDEV-484)
  if (progressType === 'agent_planning') {
    const { planning, currentAttempt, maxAttempts, retryReason } = messageData;
    // A dead card must not keep advertising facts/attempts of a request that already ended
    const facts = dead ? [] : planningFacts(planning);
    const attempt = dead ? null : planningAttempt(currentAttempt, maxAttempts, retryReason);

    return (
      <div className={classNames('ai-assistant-chat__agent-progress', deadModifiers)}>
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className={dead ? deadIcon : 'fa fa-spinner fa-spin'} />
          <span>{dead ? deadTitle : t('ai-assistant.agent-progress.planning')}</span>
        </div>
        {facts.length > 0 && <div className="ai-assistant-chat__agent-planning-facts">{facts.join(' \u00b7 ')}</div>}
        {attempt && <div className="ai-assistant-chat__agent-planning-attempt">{attempt}</div>}
      </div>
    );
  }

  // Execution state - show step checklist and progress
  if (progressType === 'agent_execution') {
    const { completedSteps = 0, totalSteps = 0, overallProgress = 0, currentStepDescription, steps } = messageData;

    return (
      <div className={classNames('ai-assistant-chat__agent-progress', deadModifiers)}>
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className={dead ? deadIcon : 'fa fa-cog fa-spin'} />
          <span>{dead ? deadTitle : t('ai-assistant.agent-progress.executing')}</span>
        </div>

        {/* Step counter */}
        <div className="ai-assistant-chat__agent-step-counter">
          {t('ai-assistant.agent-progress.step-counter', { current: completedSteps, total: totalSteps })}
        </div>

        {/* Progress bar */}
        <div className="ai-assistant-chat__agent-progress-bar">
          <div
            className={classNames('ai-assistant-chat__agent-progress-fill', {
              // A live colour on a dead card would be the one part still reporting progress, so both
              // dead states darken the bar — but with the colour their headers already use. Painting
              // a cancellation in the danger colour read as a failure, and left one card showing a
              // muted «Запрос отменён» over a red bar.
              'ai-assistant-chat__agent-progress-fill--failed': failed,
              'ai-assistant-chat__agent-progress-fill--cancelled': cancelled
            })}
            style={{
              width: `${overallProgress}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>

        {/* Current step description — the last poll's narration, muted on a dead card for the same
            reason as the planner facts above: «Создаю форму заявки…» under a «Запрос отменён» header
            is the one line still reporting live progress for a request the user stopped (A6). */}
        {!dead && currentStepDescription && <div className="ai-assistant-chat__agent-current-step">{currentStepDescription}</div>}

        {/* Step checklist */}
        {steps && steps.length > 0 && (
          <div className="ai-assistant-chat__agent-steps-list">
            {steps.map(step => (
              <StepItem key={step.id} step={step} failed={dead} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AgentProgressMessage;
