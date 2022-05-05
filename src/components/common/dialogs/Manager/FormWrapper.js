import React from 'react';
import uuidv4 from 'uuid/v4';
import Formio from 'formiojs/Formio';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
import { flattenComponents } from 'formiojs/utils/formUtils';

import { getCurrentLocale } from '../../../../helpers/export/util';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';

class FormWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containerId: 'form-wrapper-' + uuidv4()
    };

    this._form = null;
  }

  componentDidMount() {
    this.initForm();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps, this.props)) {
      this.initForm();
    }
  }

  componentWillUnmount() {
    if (this._form) {
      this._form.destroy();
      this._form = null;
    }
  }

  get form() {
    return this._form;
  }

  initForm() {
    if (this._form) {
      this._form.destroy();
      this._form = null;
    }

    if (!this.props.isVisible) {
      return;
    }

    const containerElement = document.getElementById(this.state.containerId);
    const formDefinition = this.props.formDefinition;

    if (!containerElement || !formDefinition) {
      return;
    }

    const onSubmit = this.props.onSubmit || (() => undefined);
    const options = {
      ...(this.props.formOptions || {}),
      onSubmit
    };

    const i18n = options.i18n || {};
    const language = options.language || getCurrentLocale();
    const defaultI18N = i18n[language] || {};
    const formI18N = (this.props.formI18n || {})[language] || {};

    i18n[language] = EcosFormUtils.getI18n(defaultI18N, {}, formI18N);
    options.i18n = i18n;
    options.language = language;

    const processedDefinition = EcosFormUtils.preProcessFormDefinition(formDefinition, options);
    const formPromise = Formio.createForm(containerElement, processedDefinition, options);

    formPromise.then(form => {
      let data = {};

      this.setEvents(form, { onSubmit });

      if (this.props.formData) {
        data = {
          ...this.props.formData
        };
      }

      if (!isEmpty(data)) {
        form.setValue({ data });
      }

      form.formReady.then(() => {
        isFunction(this.props.onFormReady) && this.props.onFormReady(this._form);
      });

      this._form = form;
    });
  }

  setValue = (data, flags) => {
    if (!this._form) {
      return;
    }

    /**
     * @todo Maybe should think about optimization. For example, check previous and current values
     * @todo Or set values with a delay, accumulating frequent changes into a separate object
     */
    const formData = this._form.getValue();

    this._form.setValue(
      {
        ...formData,
        data: {
          ...formData.data,
          ...data
        }
      },
      flags
    );
  };

  setEvents(form, extra = {}) {
    form.on('submit', submission => {
      let res = extra.onSubmit(submission);
      if (res && res.catch) {
        res.catch(e => {
          form.showErrors(e, true);
        });
      }
    });

    if (this.props.onFormCancel) {
      form.on('cancel', () => {
        this.props.onFormCancel();
      });
    }

    if (this.props.onFormChange) {
      form.on('change', (...args) => {
        this.props.onFormChange(...args, flattenComponents(form.components, false));
      });
    }
  }

  render() {
    return <div id={this.state.containerId} className={classNames('formio-form', this.props.className)} onClick={this.props.onClick} />;
  }
}

FormWrapper.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  isVisible: PropTypes.bool,
  formDefinition: PropTypes.object,
  formOptions: PropTypes.object,
  formI18n: PropTypes.object,
  formData: PropTypes.object,
  onClick: PropTypes.func,
  onSubmit: PropTypes.func,
  onFormCancel: PropTypes.func,
  onFormChange: PropTypes.func,
  onFormReady: PropTypes.func
};

export default FormWrapper;
