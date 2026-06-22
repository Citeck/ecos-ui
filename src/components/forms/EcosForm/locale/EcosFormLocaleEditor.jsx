import React from 'react';
import 'formiojs/FormBuilder';
import Formio from 'formiojs/Formio';
import localeForm from './locale-form';

let formPanelIdx = 0;

export default class EcosFormLocaleEditor extends React.Component {
  constructor(props) {
    super(props);

    this.form = props.form;
    this.recordId = props.recordId;

    let formId = 'eform-locale-form-panel' + formPanelIdx++;

    this.contentId = formId + '-content';

    this.state = {
      containerId: 'containerId'
    };
  }

  componentDidMount() {
    let self = this;

    Formio.createForm(document.getElementById(this.state.containerId), localeForm, {
      localesList: [
        {
          label: 'Русский',
          value: 'ru'
        },
        {
          label: 'English',
          value: 'en'
        }
      ]
    }).then(form => {
      self.setState({ form });

      let i18n = self.props.i18n || {};

      form.submission = {
        data: EcosFormLocaleEditor.convertI18nToForm(i18n)
      };

      form.on('submit', submission => {
        if (self.props.onSubmit) {
          self.props.onSubmit(EcosFormLocaleEditor.convertFormToI18n(submission.data));
        }
      });

      form.on('cancel', () => {
        if (self.props.onCancel) {
          self.props.onCancel();
        }
      });
    });
  }

  static convertI18nToForm(i18n) {
    let keys = {};

    for (let locale in i18n) {
      if (!i18n.hasOwnProperty(locale)) {
        return;
      }

      let messages = i18n[locale];

      for (let i18nKey in messages) {
        if (!messages.hasOwnProperty(i18nKey)) {
          continue;
        }

        let key = keys[i18nKey];
        if (!key) {
          key = {};
          keys[i18nKey] = key;
        }

        key[locale] = messages[i18nKey];
      }
    }

    let result = [];

    for (let key in keys) {
      if (!keys.hasOwnProperty(key)) {
        continue;
      }

      let locales = keys[key];

      let messages = [];
      for (let locale in locales) {
        if (!locales.hasOwnProperty(locale)) {
          continue;
        }
        messages.push({
          locale: locale,
          message: locales[locale]
        });
      }

      result.push({
        messageKey: key,
        messages: messages
      });
    }

    return {
      localization: result
    };
  }

  static convertFormToI18n(data) {
    let result = {};

    for (let msg of data.localization) {
      let key = msg.messageKey;
      if (!key) {
        continue;
      }

      for (let locMsg of msg.messages) {
        if (!locMsg.locale || !locMsg.message) {
          continue;
        }

        let localeMsgs = result[locMsg.locale];
        if (!localeMsgs) {
          localeMsgs = {};
          result[locMsg.locale] = localeMsgs;
        }

        localeMsgs[key] = locMsg.message;
      }
    }

    return result;
  }

  render() {
    return <div className="eform-panel-content" id={this.state.containerId} />;
  }
}
