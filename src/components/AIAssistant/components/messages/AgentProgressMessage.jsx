import React, { useState } from 'react';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../../../common';

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
const StepItem = ({ step }) => {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STEP_STATUS_ICONS[step.status] || STEP_STATUS_ICONS.PENDING;
  const hasDetails = step.output || step.error;
  const isExpandable = hasDetails && (step.status === 'COMPLETED' || step.status === 'FAILED');

  return (
    <div className={classNames('ai-assistant-chat__agent-step', statusConfig.className)}>
      <div
        className={classNames('ai-assistant-chat__agent-step-header', {
          'ai-assistant-chat__agent-step-header--expandable': isExpandable
        })}
        onClick={isExpandable ? () => setExpanded(!expanded) : undefined}
      >
        <Icon className={classNames('fa', statusConfig.icon, { 'fa-spin': statusConfig.spin })} />
        <span className="ai-assistant-chat__agent-step-description">{step.description}</span>
        {step.executionTime && step.status === 'COMPLETED' && (
          <span className="ai-assistant-chat__agent-step-time">{step.executionTime}</span>
        )}
        {isExpandable && (
          <Icon className={classNames('fa', expanded ? 'fa-chevron-up' : 'fa-chevron-down', 'ai-assistant-chat__agent-step-toggle')} />
        )}
      </div>

      {/* Error message for failed steps */}
      {step.status === 'FAILED' && step.error && (
        <div className="ai-assistant-chat__agent-step-error">
          <Icon className="fa fa-exclamation-triangle" />
          <span>{step.error}</span>
        </div>
      )}

      {/* Show/Hide button for expandable steps */}
      {isExpandable && (
        <button
          className="ai-assistant-chat__agent-step-preview-toggle"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          <Icon className={classNames('fa', expanded ? 'fa-eye-slash' : 'fa-eye')} />
          <span>{expanded ? 'Скрыть' : 'Показать'}</span>
        </button>
      )}

      {/* Expandable preview with Markdown rendering */}
      {isExpandable && expanded && (
        <div className="ai-assistant-chat__agent-step-details">
          {step.output && (
            <div className="ai-assistant-chat__agent-step-preview">
              <Markdown remarkPlugins={[remarkGfm]}>{step.output}</Markdown>
            </div>
          )}
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

  // Planning state - show spinner
  if (progressType === 'agent_planning') {
    return (
      <div className="ai-assistant-chat__agent-progress">
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className="fa fa-spinner fa-spin" />
          <span>Составляю план...</span>
        </div>
      </div>
    );
  }

  // Execution state - show step checklist and progress
  if (progressType === 'agent_execution') {
    const { completedSteps = 0, totalSteps = 0, overallProgress = 0, currentStepDescription, steps } = messageData;

    return (
      <div className="ai-assistant-chat__agent-progress">
        <div className="ai-assistant-chat__agent-progress-header">
          <Icon className="fa fa-cog fa-spin" />
          <span>Выполнение плана</span>
        </div>

        {/* Step counter */}
        <div className="ai-assistant-chat__agent-step-counter">
          Шаг {completedSteps} из {totalSteps}
        </div>

        {/* Progress bar */}
        <div className="ai-assistant-chat__agent-progress-bar">
          <div
            className="ai-assistant-chat__agent-progress-fill"
            style={{
              width: `${overallProgress}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>

        {/* Current step description */}
        {currentStepDescription && (
          <div className="ai-assistant-chat__agent-current-step">
            {currentStepDescription}
          </div>
        )}

        {/* Step checklist */}
        {steps && steps.length > 0 && (
          <div className="ai-assistant-chat__agent-steps-list">
            {steps.map((step) => (
              <StepItem key={step.id} step={step} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AgentProgressMessage;
