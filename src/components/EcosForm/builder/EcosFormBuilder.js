import React from 'react';
import 'formiojs/FormBuilder';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { SourcesId } from '../../../constants';
import Formio from '../../../forms/Formio';
import { clearFormFromCache } from '../../../forms/utils';
import { t } from '../../../helpers/export/util';
import Records from '../../Records';
import EcosFormUtils from '../EcosFormUtils';

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
    return await Records.get(`${SourcesId.FORM}@DEFAULT`).load('definition?json');
  }

  async makeDefaultForm() {
    const { options } = this.props;
    const data = await this.getDefaultForm();

    Formio.builder(document.getElementById(this.contentId), { components: get(data, 'components') || [] }, options).then(editorForm => {
      this.setState({ editorForm });
    });
  }

  componentDidMount() {
    const { options, formDefinition } = this.props;
    const isDefault = this.isDefaultForm();

    if (isDefault) {
      this.makeDefaultForm();
    } else {
      Formio.builder(document.getElementById(this.contentId), formDefinition, options).then(editorForm => {
        this.setState({ editorForm });
      });
    }
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
