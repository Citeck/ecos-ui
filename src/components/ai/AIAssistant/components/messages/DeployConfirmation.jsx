import classNames from 'classnames';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { DEPLOY_ACTION, getDeployScopeKey } from '../../constants';

import MessageActions from './MessageActions';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

/**
 * Config-agent HITL deploy confirmation (COREDEV-323 contract #3).
 *
 * Renders the agent's message, the resolved target scope label, and — when the
 * pending deploy is `changeable` — a selector over `pendingDeploy.options`. On
 * `deploy_confirm` the chosen scope is sent back as `{kind, workspaceId?}` via the
 * action payload; `deploy_reject` carries no scope. Scope labels come localized
 * from the backend and are rendered verbatim; only the selector chrome is i18n'd.
 *
 * @param {Object} props
 * @param {Object} props.message - Message object; `messageData.pendingDeploy` is required
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onActionClick - (actionId, extra?) => void
 */
const DeployConfirmation = ({ message, markdownComponents, onActionClick }) => {
  const { messageData, text } = message || {};
  const pendingDeploy = messageData?.pendingDeploy;

  const initialScope = pendingDeploy?.targetScope;
  const [selectedKey, setSelectedKey] = useState(getDeployScopeKey(initialScope));

  if (!pendingDeploy) return null;

  const { targetScope, changeable, options } = pendingDeploy;
  const scopeOptions = Array.isArray(options) ? options : [];
  const showSelector = !!changeable && scopeOptions.length > 1;

  const selectedScope = showSelector
    ? scopeOptions.find(opt => getDeployScopeKey(opt) === selectedKey) || targetScope
    : targetScope;

  const handleAction = (actionId, extra = {}) => {
    if (actionId === DEPLOY_ACTION.CONFIRM && selectedScope) {
      onActionClick?.(actionId, {
        ...extra,
        deployScope: {
          kind: selectedScope.kind,
          ...(selectedScope.workspaceId && { workspaceId: selectedScope.workspaceId })
        }
      });
      return;
    }
    onActionClick?.(actionId, extra);
  };

  return (
    <div className="ai-assistant-chat__deploy-confirm">
      {text && (
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </Markdown>
      )}

      <div className="ai-assistant-chat__deploy-confirm-scope">
        <Icon className="fa fa-rocket ai-assistant-chat__deploy-confirm-scope-icon" />
        <span className="ai-assistant-chat__deploy-confirm-scope-label">{selectedScope?.label}</span>
      </div>

      {showSelector && (
        <div className="ai-assistant-chat__deploy-confirm-options">
          <div className="ai-assistant-chat__deploy-confirm-options-title">{t('ai-assistant.deploy.scope.change')}</div>
          {scopeOptions.map(opt => {
            const key = getDeployScopeKey(opt);
            const checked = key === selectedKey;
            return (
              <label
                key={key}
                className={classNames('ai-assistant-chat__deploy-confirm-option', {
                  'ai-assistant-chat__deploy-confirm-option--checked': checked
                })}
              >
                <input type="radio" name={`deploy-scope-${message.id}`} checked={checked} onChange={() => setSelectedKey(key)} />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      <MessageActions actions={messageData.actions} messageId={message.id} onActionClick={handleAction} />
    </div>
  );
};

export default DeployConfirmation;
