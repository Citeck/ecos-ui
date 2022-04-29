import React from 'react';
import uuidv4 from 'uuid/v4';
import Formio from 'formiojs/Formio';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import classNames from 'classnames';

import { getCurrentLocale } from '../../../../helpers/export/util';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';

class FormWrapper extends React.Component {
  #cachedForms = {};

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
    const { cached, id } = this.props;

    if (cached && prevProps.id && !isEqual(prevProps.id, id) && this._form) {
      this.#cachedForms[prevProps.id] = cloneDeep(this._form.getValue().data);
    }

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

      if (this.props.cached) {
        data = {
          ...(data || {}),
          ...get(this.#cachedForms, this.props.id, {})
        };
      }

      form.setValue({ data });

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

  clearFromCache = id => {
    if (id) {
      delete this.#cachedForms[id];
    }
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
        this.props.onFormChange(...args);
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
  cached: PropTypes.bool,
  formDefinition: PropTypes.object,
  formOptions: PropTypes.object,
  formI18n: PropTypes.object,
  formData: PropTypes.object,
  onClick: PropTypes.func,
  onSubmit: PropTypes.func,
  onFormCancel: PropTypes.func,
  onFormChange: PropTypes.func
};

export default FormWrapper;
