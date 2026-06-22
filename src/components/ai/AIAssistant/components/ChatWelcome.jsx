import React from 'react';

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
 */
const ChatWelcome = ({
  activeTab,
  contextHint = ''
}) => {
  return (
    <div className="ai-assistant-chat__empty">
      <div className="ai-assistant-chat__welcome">
        <h4>{t('ai-assistant.welcome.title')}</h4>
        <p>{t('ai-assistant.welcome.subtitle')}</p>
      </div>

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
