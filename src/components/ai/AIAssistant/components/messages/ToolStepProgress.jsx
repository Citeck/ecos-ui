import classNames from 'classnames';
import React from 'react';

import { AGENT_ENGINE, getToolStepStatusConfig } from '../../constants';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

/**
 * Both engines share the `agent_tool_step` feed, so the ribbon title is chosen from the engine
 * (`messageData.domain`, stamped by the backend reporter) rather than hardcoded — otherwise an
 * operational run is mislabeled "Настройка платформы". `CONFIGURATION` → config, everything else
 * (incl. a missing domain) → operational, mirroring `getAgentEngine`'s non-CONFIG-is-operational rule.
 */
const TOOL_LOOP_DOMAIN_CONFIG = 'CONFIGURATION';
const AGENT_PROGRESS_TITLE_KEYS = {
  [AGENT_ENGINE.CONFIG]: 'ai-assistant.agent-progress.tool-loop',
  [AGENT_ENGINE.TOOL_LOOP]: 'ai-assistant.agent-progress.operational'
};

/**
 * Renders a single tool invocation in the config-agent tool-loop ribbon.
 * Status drives the icon/colour: RUNNING (spinner), DONE (check), ERROR (cross).
 * Labels arrive already localized from the backend; `detail` is shown when present.
 */
const ToolStepItem = ({ step, failed = false }) => {
  const statusConfig = getToolStepStatusConfig(step.status);

  return (
    <div className={classNames('ai-assistant-chat__tool-step', statusConfig.className)}>
      <div className="ai-assistant-chat__tool-step-header">
        {/* A RUNNING step left behind by a dead turn must stop spinning with the rest of the ribbon */}
        <Icon className={classNames('fa', statusConfig.icon, { 'fa-spin': statusConfig.spin && !failed })} />
        <span className="ai-assistant-chat__tool-step-label">{step.label || step.tool}</span>
      </div>
      {step.detail && <div className="ai-assistant-chat__tool-step-detail">{step.detail}</div>}
    </div>
  );
};

/**
 * Config-agent tool-loop progress (COREDEV-323 contract #2).
 * Renders the cumulative, self-contained `toolSteps` feed (search → generate form →
 * validate → deploy) with an incremental RUNNING/DONE/ERROR status per step. The feed is
 * merged by `stepIndex` upstream (`buildProgressMessageData`/`handlePollingProgress`), so this
 * component only needs to render whatever steps the message currently carries.
 *
 * @param {Object} props
 * @param {Object} props.message - Full message object; `messageData.toolSteps` holds the feed
 */
const ToolStepProgress = ({ message }) => {
  const { messageData } = message || {};

  if (!messageData) return null;

  const steps = messageData.toolSteps || [];
  const engine = messageData.domain === TOOL_LOOP_DOMAIN_CONFIG ? AGENT_ENGINE.CONFIG : AGENT_ENGINE.TOOL_LOOP;
  // `handlePollingError` stamps the failure here; the ribbon renders only from `messageData`, so
  // without honouring it the cogs keep turning for a request that is already dead (D-B-7)
  const failed = !!messageData.error;

  return (
    <div className={classNames('ai-assistant-chat__tool-loop', { 'ai-assistant-chat__tool-loop--failed': failed })}>
      <div className="ai-assistant-chat__tool-loop-header">
        {/* Original spinning "in progress" indicator (fa-cogs); the engine is conveyed by the title.
            Do NOT swap in an engine-specific glyph like fa-robot — it doesn't exist in Font Awesome 4.7
            and renders blank. */}
        <Icon className={failed ? 'fa fa-exclamation-triangle' : 'fa fa-cogs fa-spin'} />
        <span>{failed ? t('ai-assistant.chat.request-failed') : t(AGENT_PROGRESS_TITLE_KEYS[engine])}</span>
      </div>

      {steps.length > 0 && (
        <div className="ai-assistant-chat__tool-steps-list">
          {steps.map(step => (
            <ToolStepItem key={step.stepIndex} step={step} failed={failed} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolStepProgress;
