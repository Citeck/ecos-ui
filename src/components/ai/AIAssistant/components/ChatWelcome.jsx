import React from 'react';

import { AGENT_ENGINE, API_ENDPOINTS, PLATFORM_CONFIG_AGENT_ID, getAgentEngine } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

const TAB_TYPES = {
  UNIVERSAL: 'universal',
  CONTEXTUAL: 'contextual'
};

const Capability = ({ titleKey, descKey }) => (
  <div className="ai-assistant-chat__capability">
    <strong>{t(titleKey)}</strong> — {t(descKey)}
  </div>
);

/**
 * Welcome screen component shown when chat is empty
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab
 * @param {string} props.contextHint - Hint text for contextual tab
 * @param {Function} [props.onSelectAgent] - Selects an agent (used by the "configure platform" shortcut)
 */
const ChatWelcome = ({
  activeTab,
  contextHint = '',
  onSelectAgent
}) => {
  // Resolve the real config agent from /ai-agent/list (so its localized name shows in the selector),
  // falling back to a minimal CONFIG-engine descriptor if the list is unavailable.
  const handleConfigure = async () => {
    let configAgent = { id: PLATFORM_CONFIG_AGENT_ID, name: t('ai-agent.engine.config'), engine: AGENT_ENGINE.CONFIG };
    try {
      const response = await fetch(API_ENDPOINTS.AGENT_LIST);
      if (response.ok) {
        const data = await response.json();
        // Prefer the explicit config-agent id; only fall back to the first CONFIG-engine
        // agent if that id is absent, so multiple config agents can't misroute the shortcut.
        const found =
          Array.isArray(data) &&
          (data.find(agent => agent.id === PLATFORM_CONFIG_AGENT_ID) || data.find(agent => getAgentEngine(agent) === AGENT_ENGINE.CONFIG));
        if (found) configAgent = found;
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
    onSelectAgent?.(configAgent);
  };

  return (
    <div className="ai-assistant-chat__empty">
      <div className="ai-assistant-chat__welcome">
        <h4>{t('ai-assistant.welcome.title')}</h4>
        <p>{t('ai-assistant.welcome.subtitle')}</p>
      </div>

      {activeTab === TAB_TYPES.UNIVERSAL && (
        <div className="ai-assistant-chat__modes">
          <div className="ai-assistant-chat__mode ai-assistant-chat__mode--operational">
            <strong>{t('ai-assistant.welcome.operational.title')}</strong>
            <p>{t('ai-assistant.welcome.operational.description')}</p>
          </div>
          <div className="ai-assistant-chat__mode ai-assistant-chat__mode--config">
            <strong>{t('ai-assistant.welcome.config.title')}</strong>
            <p>{t('ai-assistant.welcome.config.description')}</p>
            {onSelectAgent && (
              <button type="button" className="ai-assistant-chat__mode-action" onClick={handleConfigure}>
                {t('ai-assistant.welcome.config.action')}
              </button>
            )}
          </div>
          <p className="ai-assistant-chat__modes-hint">{t('ai-assistant.welcome.modes.switch-hint')}</p>
        </div>
      )}

      {activeTab === TAB_TYPES.UNIVERSAL && (
        <div className="ai-assistant-chat__capabilities">
          <h5 className="ai-assistant-chat__section">{t('ai-assistant.welcome.section.config')}</h5>
          <Capability titleKey="ai-assistant.welcome.capability.business-apps.title" descKey="ai-assistant.welcome.capability.business-apps.description" />
          <Capability titleKey="ai-assistant.welcome.capability.data-types.title" descKey="ai-assistant.welcome.capability.data-types.description" />
          <Capability titleKey="ai-assistant.welcome.capability.forms.title" descKey="ai-assistant.welcome.capability.forms.description" />
          <Capability titleKey="ai-assistant.welcome.capability.bpmn.title" descKey="ai-assistant.welcome.capability.bpmn.description" />
          <Capability titleKey="ai-assistant.welcome.capability.scripts.title" descKey="ai-assistant.welcome.capability.scripts.description" />
          <Capability titleKey="ai-assistant.welcome.capability.app-docs.title" descKey="ai-assistant.welcome.capability.app-docs.description" />
          <Capability titleKey="ai-assistant.welcome.capability.platform-docs.title" descKey="ai-assistant.welcome.capability.platform-docs.description" />

          <h5 className="ai-assistant-chat__section">{t('ai-assistant.welcome.section.tasks')}</h5>
          <Capability titleKey="ai-assistant.welcome.capability.tasks.title" descKey="ai-assistant.welcome.capability.tasks.description" />
          <Capability titleKey="ai-assistant.welcome.capability.record-search.title" descKey="ai-assistant.welcome.capability.record-search.description" />
          <Capability titleKey="ai-assistant.welcome.capability.data-edit.title" descKey="ai-assistant.welcome.capability.data-edit.description" />
          <Capability titleKey="ai-assistant.welcome.capability.record-create.title" descKey="ai-assistant.welcome.capability.record-create.description" />
          <Capability titleKey="ai-assistant.welcome.capability.comments.title" descKey="ai-assistant.welcome.capability.comments.description" />

          <h5 className="ai-assistant-chat__section">{t('ai-assistant.welcome.section.content')}</h5>
          <Capability titleKey="ai-assistant.welcome.capability.doc-analysis.title" descKey="ai-assistant.welcome.capability.doc-analysis.description" />
          <Capability titleKey="ai-assistant.welcome.capability.text-editing.title" descKey="ai-assistant.welcome.capability.text-editing.description" />
          <Capability titleKey="ai-assistant.welcome.capability.emails.title" descKey="ai-assistant.welcome.capability.emails.description" />
          <Capability titleKey="ai-assistant.welcome.capability.images.title" descKey="ai-assistant.welcome.capability.images.description" />

          <h5 className="ai-assistant-chat__section">{t('ai-assistant.welcome.section.search')}</h5>
          <Capability titleKey="ai-assistant.welcome.capability.doc-search.title" descKey="ai-assistant.welcome.capability.doc-search.description" />
          <Capability titleKey="ai-assistant.welcome.capability.client-360.title" descKey="ai-assistant.welcome.capability.client-360.description" />

          <h5 className="ai-assistant-chat__section">{t('ai-assistant.welcome.section.agents')}</h5>
          <Capability titleKey="ai-assistant.welcome.capability.specialized-agents.title" descKey="ai-assistant.welcome.capability.specialized-agents.description" />
          <Capability titleKey="ai-assistant.welcome.capability.multi-step.title" descKey="ai-assistant.welcome.capability.multi-step.description" />

          <p className="ai-assistant-chat__hint">
            <strong>{t('ai-assistant.welcome.examples-title')}</strong><br />
            {t('ai-assistant.welcome.example.1')}<br />
            {t('ai-assistant.welcome.example.2')}<br />
            {t('ai-assistant.welcome.example.3')}<br />
            {t('ai-assistant.welcome.example.4')}<br />
            {t('ai-assistant.welcome.example.5')}<br />
            {t('ai-assistant.welcome.example.6')}<br />
            {t('ai-assistant.welcome.example.7')}<br />
            {t('ai-assistant.welcome.example.8')}
          </p>

          <p className="ai-assistant-chat__tip">
            💡 {t('ai-assistant.welcome.tip.before')} <code>@</code> {t('ai-assistant.welcome.tip.after')}
          </p>
        </div>
      )}

      {activeTab === TAB_TYPES.CONTEXTUAL && contextHint && (
        <p className="ai-assistant-chat__hint">{contextHint}</p>
      )}
    </div>
  );
};

export default ChatWelcome;
