import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/export/util';
import { isValid as isValidCondition } from '../../../helpers/validators/displayCondition';
import { InfoText } from '../../common';
import { Caption, Input, Textarea } from '../../common/form';
import { Btn } from '../../common/btns';

import './style.scss';

const Labels = {
  TITLE: 'doc-constructor-widget.settings.title',
  JOURNAL_TEMPLATES_ID: 'doc-constructor-widget.settings.prop.journal-templates-id',
  WIDGET_DISPLAY_CONDITION: 'widget.display-condition.widget-title',
  ERROR_WIDGET_DISPLAY_CONDITION: 'widget.display-condition.error.invalid',
  RESULT_WIDGET_DISPLAY_CONDITION: 'widget.display-condition.info.visible-result--', //todo for ECOSUI-329
  BTN_CANCEL: 'doc-constructor-widget.settings.button.cancel',
  BTN_SAVE: 'doc-constructor-widget.settings.button.save'
};

class Settings extends React.Component {
  static propTypes = {
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    config: PropTypes.object
  };

  static defaultProps = {
    config: {}
  };

  state = {
    widgetDisplayCondition: '',
    journalTemplatesId: ''
  };

  componentDidMount() {
    const { widgetDisplayCondition, journalTemplatesId } = this.props.config;

    this.setState({ widgetDisplayCondition, journalTemplatesId });
  }

  onSave = () => {
    const { widgetDisplayCondition, journalTemplatesId } = this.state;
    const isValid = isValidCondition(widgetDisplayCondition);

    this.setState({ errorCondition: !isValid });

    if (isValid) {
      this.props.onSave({ widgetDisplayCondition, journalTemplatesId });
    }
  };

  onCancel = () => {
    this.props.onCancel();
  };

  onChangeCondition = event => {
    this.setState({ widgetDisplayCondition: event.target.value });
  };

  onChangeJournalTemplates = event => {
    this.setState({ journalTemplatesId: event.target.value });
  };

  render() {
    const { errorCondition, journalTemplatesId, widgetDisplayCondition } = this.state;

    return (
      <div className="ecos-doc-constructor-settings">
        <Caption middle className="ecos-doc-constructor-settings__title">
          {t(Labels.TITLE)}
        </Caption>
        <div className="ecos-doc-constructor-settings__block">
          <div className="ecos-doc-constructor-settings__subtitle">{t(Labels.JOURNAL_TEMPLATES_ID)}</div>
          <Input defaultValue={journalTemplatesId} onChange={this.onChangeJournalTemplates} />
        </div>
        <div className="ecos-doc-constructor-settings__block">
          <div className="ecos-doc-constructor-settings__subtitle">{t(Labels.WIDGET_DISPLAY_CONDITION)}</div>
          <Textarea
            value={widgetDisplayCondition}
            onChange={this.onChangeCondition}
            placeholder={'[{ "t": "eq", "att": "title", "val": "№333" }, ...]'}
          />
          {errorCondition && (
            <InfoText className="ecos-doc-constructor-settings__info" text={t(Labels.ERROR_WIDGET_DISPLAY_CONDITION)} type="error" />
          )}
        </div>
        <div className="ecos-doc-constructor-settings__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.onCancel}>
            {t(Labels.BTN_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.onSave}>
            {t(Labels.BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}

export default Settings;
