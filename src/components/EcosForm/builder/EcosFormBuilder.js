import React from 'react';
import 'formiojs/FormBuilder';

import EcosFormUtils from '../EcosFormUtils';
import { t } from '../../../helpers/export/util';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import Records from '../../Records';

let formPanelIdx = 0;

export default class EcosFormBuilder extends React.Component {
  constructor(props) {
    super(props);

    let formId = 'eform-editor-form-panel' + formPanelIdx++;

    this.contentId = formId + '-content';
  }

  isDefaultForm() {
    return isEmpty(get(this.props, 'formDefinition.components'));
  }

  async getDefaultForm() {
    return await Records.get('uiserv/form@DEFAULT').load('definition?json');
  }

  async makeDefaultForm() {
    const data = await this.getDefaultForm();
    console.log(data);
    window.Formio.builder(document.getElementById(this.contentId), {
      components: data.components
    }).then(editorForm => {
      this.setState({
        editorForm: editorForm
      });
    });
  }

  componentDidMount() {
    const isDefault = this.isDefaultForm();

    if (isDefault) {
      this.makeDefaultForm();
    } else {
      window.Formio.builder(document.getElementById(this.contentId), this.props.formDefinition).then(editorForm => {
        this.setState({
          editorForm: editorForm
        });
      });
    }
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
          <button className="btn btn-default btn-md eform-edit-form-btn btn-secondary mr-3" onClick={onCancel} type="button">
            {t('btn.cancel.label')}
          </button>

          <button className="btn btn-default btn-md eform-edit-form-btn btn-primary" onClick={onSubmit} type="button">
            {t('btn.save.label')}
          </button>
        </div>
      </div>
    );
  }
}
