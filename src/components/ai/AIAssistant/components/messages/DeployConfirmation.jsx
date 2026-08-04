import classNames from 'classnames';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { DEPLOY_ACTION, getDeployScopeKey } from '../../constants';

import ArtifactsList from './ArtifactsList';
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
 * @param {boolean} props.actionsDisabled - Whether the buttons and the scope selector must be locked:
 *   the gate is no longer live, or a request is in flight (see MessageList)
 * @param {boolean} props.actionsStale - Whether the gate is no longer live, without the in-flight
 *   freeze folded in; decides whether the card reports a draft selection or the scope that was sent
 * @param {Function} props.onSelectDeployScope - (messageId, scopeKey) => void; records the draft
 *   selection on the message so it survives a remount
 */
const DeployConfirmation = ({
  message,
  markdownComponents,
  onActionClick,
  onSelectDeployScope,
  actionsDisabled = false,
  actionsFrozen = false,
  actionsStale = false
}) => {
  const { messageData, text } = message || {};
  const pendingDeploy = messageData?.pendingDeploy;

  const initialScope = pendingDeploy?.targetScope;
  // Seeded from the message rather than from the backend default alone: this component is remounted
  // from scratch every time the chat window is restored (`AIAssistantChat.jsx`: `{!isMinimized && …}`
  // unmounts the message list), so a draft kept only in state would silently revert to the default
  // and the next confirm would deploy to a scope the user had changed away from. `handleSelectScope`
  // writes the key back to the message through `onSelectDeployScope`.
  const [selectedKey, setSelectedKey] = useState(messageData?.draftDeployScopeKey || getDeployScopeKey(initialScope));
  // The scope this card actually sent, recorded on the message by `handleActionClick` once the
  // `deploy_confirm` POST is accepted. Needed because a selection alone proves nothing: the gate
  // can also go stale without ever being confirmed from this card (the user answered with free
  // text, a newer gate superseded it). It lives on the message and not in this component's state
  // because the message list is unmounted whenever the chat window is minimized
  // (`AIAssistantChat.jsx`: `{!isMinimized && …}`) — local state would not survive a restore, and
  // the card would go back to showing the backend's default scope for an already-sent deploy.
  const sentScope = messageData?.sentDeployScope;

  if (!pendingDeploy) return null;

  const { targetScope, changeable, options } = pendingDeploy;
  const scopeOptions = Array.isArray(options) ? options : [];
  const showSelector = !!changeable && scopeOptions.length > 1;

  const draftScope = showSelector ? scopeOptions.find(opt => getDeployScopeKey(opt) === selectedKey) || targetScope : targetScope;
  // While the gate is live the label follows the selection. Once it is not, the label reports what
  // was actually sent — the confirmed scope, or the backend's own target when nothing was sent from
  // here — so the history never shows a scope the deploy was never asked to use.
  //
  // The switch is driven by staleness alone, never by `actionsDisabled`: that one also covers the
  // in-flight freeze, and `handleActionClick` raises the freeze BEFORE the POST while writing
  // `sentDeployScope` only after it returns. Folding the freeze in here made the card fall back to
  // the backend's default for the whole round trip — the label flipped away from the scope the user
  // had just confirmed and the radio jumped to the first option, showing a scope that was never sent.
  const selectedScope = actionsStale ? sentScope || targetScope : draftScope;
  const shownKey = getDeployScopeKey(selectedScope);

  const handleSelectScope = key => {
    setSelectedKey(key);
    onSelectDeployScope?.(message.id, key);
  };

  const handleAction = (actionId, extra = {}) => {
    if (actionId === DEPLOY_ACTION.CONFIRM && draftScope) {
      onActionClick?.(actionId, {
        ...extra,
        deployScope: {
          kind: draftScope.kind,
          ...(draftScope.workspaceId && { workspaceId: draftScope.workspaceId })
        },
        // Whole option (it carries the backend's localized `label`, which the request payload
        // does not) so the handler can record on the message what this card actually sent.
        deployScopeOption: draftScope
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

      {/* A prior artifact deployed earlier in this flow (e.g. the type before its dependent form)
          rides along on this next deploy gate — surface its clickable link so the user can open it. */}
      {messageData?.artifacts && <ArtifactsList artifacts={messageData.artifacts} />}

      <div className="ai-assistant-chat__deploy-confirm-scope">
        <Icon className="fa fa-rocket ai-assistant-chat__deploy-confirm-scope-icon" />
        <span className="ai-assistant-chat__deploy-confirm-scope-label">{selectedScope?.label}</span>
      </div>

      {showSelector && (
        <div className="ai-assistant-chat__deploy-confirm-options">
          <div className="ai-assistant-chat__deploy-confirm-options-title">{t('ai-assistant.deploy.scope.change')}</div>
          {scopeOptions.map(opt => {
            const key = getDeployScopeKey(opt);
            const checked = key === shownKey;
            return (
              <label
                key={key}
                className={classNames('ai-assistant-chat__deploy-confirm-option', {
                  'ai-assistant-chat__deploy-confirm-option--checked': checked,
                  // Muting the options says «this gate is already decided», so it follows staleness
                  // and not `actionsDisabled`: the latter folds in the in-flight freeze, which would
                  // grey out a live, undecided card for the length of any unrelated round trip. The
                  // `disabled` attribute below is the opposite — it must follow the freeze too.
                  'ai-assistant-chat__deploy-confirm-option--stale': actionsStale
                })}
              >
                <input
                  type="radio"
                  name={`deploy-scope-${message.id}`}
                  checked={checked}
                  disabled={actionsDisabled}
                  onChange={() => handleSelectScope(key)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      <MessageActions
        actions={messageData.actions}
        messageId={message.id}
        onActionClick={handleAction}
        disabled={actionsDisabled}
        frozen={actionsFrozen}
        stale={actionsStale}
        resolvedFileTempRefs={messageData.resolvedFileTempRefs}
      />
    </div>
  );
};

export default DeployConfirmation;
