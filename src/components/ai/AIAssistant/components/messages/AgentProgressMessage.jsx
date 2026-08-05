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

  // Config-agent tool-loop feed (contract #2) — cumulative tool-step ribbon
  if (progressType === AGENT_TOOL_STEP_PROGRESS_TYPE) {
    return <ToolStepProgress message={message} />;
  }

  // Planning state - show spinner
  if (progressType === 'agent_planning') {
    return (
      <div className={classNames('ai-assistant-chat__agent-progress', { 'ai-assistant-chat__agent-progress--failed': failed })}>
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className={failed ? 'fa fa-exclamation-triangle' : 'fa fa-spinner fa-spin'} />
          <span>{failed ? t('ai-assistant.chat.request-failed') : t('ai-assistant.agent-progress.planning')}</span>
        </div>
      </div>
    );
  }

  // Execution state - show step checklist and progress
  if (progressType === 'agent_execution') {
    const { completedSteps = 0, totalSteps = 0, overallProgress = 0, currentStepDescription, steps } = messageData;

    return (
      <div className={classNames('ai-assistant-chat__agent-progress', { 'ai-assistant-chat__agent-progress--failed': failed })}>
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className={failed ? 'fa fa-exclamation-triangle' : 'fa fa-cog fa-spin'} />
          <span>{failed ? t('ai-assistant.chat.request-failed') : t('ai-assistant.agent-progress.executing')}</span>
        </div>

        {/* Step counter */}
        <div className="ai-assistant-chat__agent-step-counter">
          {t('ai-assistant.agent-progress.step-counter', { current: completedSteps, total: totalSteps })}
        </div>

        {/* Progress bar */}
        <div className="ai-assistant-chat__agent-progress-bar">
          <div
            className={classNames('ai-assistant-chat__agent-progress-fill', {
              'ai-assistant-chat__agent-progress-fill--failed': failed
            })}
            style={{
              width: `${overallProgress}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>

        {/* Current step description */}
        {currentStepDescription && <div className="ai-assistant-chat__agent-current-step">{currentStepDescription}</div>}

        {/* Step checklist */}
        {steps && steps.length > 0 && (
          <div className="ai-assistant-chat__agent-steps-list">
            {steps.map(step => (
              <StepItem key={step.id} step={step} failed={failed} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AgentProgressMessage;
