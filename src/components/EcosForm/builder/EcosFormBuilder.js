import React from 'react';
import 'formiojs/FormBuilder';
import get from 'lodash/get';

import EcosFormUtils from '../EcosFormUtils';
import Formio from '../../../forms/Formio';
import { clearFormFromCache } from '../../../forms/utils';

let formPanelIdx = 0;

export default class EcosFormBuilder extends React.Component {
  constructor(props) {
    super(props);

    let formId = 'eform-editor-form-panel' + formPanelIdx++;

    this.contentId = formId + '-content';
  }

  componentDidMount() {
    const { options, formDefinition } = this.props;

    Formio.builder(document.getElementById(this.contentId), formDefinition, options).then(editorForm => {
      this.setState({ editorForm });
    });
  }

  componentWillUnmount() {
    clearFormFromCache(get(this.state, 'editorForm.id'));
  }

  onCancel() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  onSubmit() {
    if (this.props.onSubmit) {
      this.props.onSubmit(EcosFormUtils.optimizeFormSchema(this.state.editorForm.form));
    }
  }

  render() {
    let onCancel = this.onCancel.bind(this);
    let onSubmit = this.onSubmit.bind(this);

    return (
      <div>
        <div className="eform-panel-content" id={this.contentId} />
        <div className="eform-panel-actions">
          <button className="btn btn-default btn-md eform-edit-form-btn btn-primary" onClick={onSubmit} type="button">
            Save
          </button>
          <button className="btn btn-default btn-md eform-edit-form-btn btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
