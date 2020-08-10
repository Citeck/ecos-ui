import React from 'react';
import uuidv4 from 'uuid/v4';
import Formio from 'formiojs/Formio';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';

export default class FormWrapper extends React.Component {
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

  componentDidUpdate(prevProps, prevState) {
    this.initForm();
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

    const onSubmit = this.props.onSubmit || (() => {});
    const options = {
      ...(this.props.formOptions || {}),
      onSubmit
    };

    const processedDefinition = EcosFormUtils.preProcessFormDefinition(formDefinition, options);

    const formPromise = Formio.createForm(containerElement, processedDefinition, options);
    formPromise.then(form => {
      this._form = form;
      form.on('submit', submission => {
        let res = onSubmit(submission);
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
      if (this.props.formData) {
        form.submission = {
          data: this.props.formData
        };
      }
    });
  }

  componentWillUnmount() {
    if (this._form) {
      this._form.destroy();
      this._form = null;
    }
  }

  render() {
    return <div className={'formio-form'} id={this.state.containerId} />;
  }
}
