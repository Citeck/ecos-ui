import 'formiojs/FormBuilder';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

import { SourcesId } from '../../../constants';
import Formio from '../../../forms/Formio';
import { clearFormFromCache } from '../../../forms/utils';
import { t } from '../../../helpers/export/util';
import Records from '../../Records';
import EcosFormUtils from '../EcosFormUtils';

let formPanelIdx = 0;

export default class EcosFormBuilder extends React.Component {
  _builderToken = 0;
  _editorForm = null;

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

  _createInnerContainer() {
    const outer = document.getElementById(this.contentId);
    if (!outer) {
      return null;
    }
    outer.innerHTML = '';
    const inner = document.createElement('div');
    outer.appendChild(inner);
    return inner;
  }

  async makeDefaultForm(token) {
    const { options } = this.props;
    const data = await this.getDefaultForm();

    if (this._builderToken !== token) {
      return;
    }

    const inner = this._createInnerContainer();
    if (!inner) {
      return;
    }

    Formio.builder(inner, { components: get(data, 'components') || [] }, options).then(editorForm => {
      if (this._builderToken === token) {
        this._editorForm = editorForm;
        this.setState({ editorForm });
      } else {
        clearFormFromCache(editorForm.id);
        editorForm.destroy();
      }
    });
  }

  componentDidMount() {
    const token = ++this._builderToken;
    const { options, formDefinition } = this.props;
    const isDefault = this.isDefaultForm();

    if (isDefault) {
      this.makeDefaultForm(token);
    } else {
      const inner = this._createInnerContainer();
      if (!inner) {
        return;
      }
      Formio.builder(inner, formDefinition, options).then(editorForm => {
        if (this._builderToken === token) {
          this._editorForm = editorForm;
          this.setState({ editorForm });
        } else {
          clearFormFromCache(editorForm.id);
          editorForm.destroy();
        }
      });
    }
  }

  componentWillUnmount() {
    this._builderToken++;

    if (this._editorForm) {
      clearFormFromCache(this._editorForm.id);
      this._editorForm.destroy();
      this._editorForm = null;
    }

    const outer = document.getElementById(this.contentId);
    if (outer) {
      outer.innerHTML = '';
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
