import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import { flattenComponents } from 'formiojs/utils/formUtils';

import EcosModal from '../../common/EcosModal';
import EcosFormBuilder from './EcosFormBuilder';
import DialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/export/util';
import { Icon } from '../../common';
import DebugModal from './DebugModal';
import { clearFormFromCache } from '../../../forms/utils';

import './style.scss';

const Labels = {
  CLOSE_CONFIRM_DESCRIPTION: 'ecos-form.builder.confirm-close.description',
  DEBUG_TITLE: 'ecos-form.builder.debugging.title',
  FORM_ID_LABEL: 'ecos-form.builder.form-id.label'
};

export default class EcosFormBuilderModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formDefinition: {},
      isModalOpen: false,
      isDebugModalOpen: false,
      isOpenDependencies: true,
      isOpenInfluence: true,
      formId: props.formId || null,
      options: {}
    };
  }

  /**
   *
   * @param formDefinition {String|Object} - The src of the form, or a form object.
   * @param onSubmit {Function}
   * @param options {FormOptions}
   */
  show(formDefinition, onSubmit, options = {}) {
    this.setState({
      isModalOpen: true,
      formDefinition: cloneDeep(formDefinition),
      options,
      onSubmit,
      formId: get(formDefinition, 'formId')
    });
  }

  setStateData = (data = {}) => {
    const newState = {};

    Object.keys(data).forEach(key => {
      if (!isEqual(data.key, this.state[key])) {
        newState[key] = data[key];
      }
    });

    if (!isEmpty(newState)) {
      this.setState({ ...newState });
    }
  };

  hide() {
    this.setState({
      isModalOpen: false
    });
  }

  renderTitle() {
    const { formId } = this.state;

    if (!formId) {
      return null;
    }

    return (
      <div className="form-builder-modal__info">
        <span className="form-builder-modal__info-key">{t(Labels.FORM_ID_LABEL)}:</span>
        <span className="form-builder-modal__info-value">{formId}</span>
      </div>
    );
  }

  toggleVisibility = () => {
    DialogManager.confirmDialog({
      text: t(Labels.CLOSE_CONFIRM_DESCRIPTION),
      onYes: () => {
        this.setState(({ isModalOpen }) => ({
          isModalOpen: !isModalOpen
        }));

        clearFormFromCache(this.props.formId);
      }
    });
  };

  onSubmit = form => {
    if (isFunction(this.state.onSubmit)) {
      this.state.onSubmit(form);
    }
    this.hide();
  };

  onToggleShowDebugModal = () => {
    this.setState(state => ({ isDebugModalOpen: !state.isDebugModalOpen }));
  };

  onToggleInfluence = () => {
    this.setState(state => ({ isOpenInfluence: !state.isOpenInfluence }));
  };

  onToggleDependencies = () => {
    this.setState(state => ({ isOpenDependencies: !state.isOpenDependencies }));
  };

  renderCustomButtons() {
    return [
      <Icon
        key="ecos-form-builder-modal-debug-btn"
        className="icon-bug mr-2 icon_md ecos-form-modal__btn-settings"
        title={t(Labels.DEBUG_TITLE)}
        onClick={this.onToggleShowDebugModal}
      />
    ];
  }

  renderDebugModal() {
    const { isDebugModalOpen, formDefinition } = this.state;

    return (
      <DebugModal
        isOpen={isDebugModalOpen}
        onClose={this.onToggleShowDebugModal}
        components={flattenComponents(get(formDefinition, 'components', []), false)}
      />
    );
  }

  render() {
    const { isModalOpen, formDefinition, options } = this.state;

    return (
      <>
        <EcosModal
          customLevel={0}
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-extra-lg ecos-modal_fullscreen"
          title={t('eform.modal.title.constructor')}
          isOpen={isModalOpen}
          zIndex={9000}
          hideModal={this.toggleVisibility}
          customButtons={this.renderCustomButtons()}
        >
          {this.renderTitle()}
          <EcosFormBuilder options={options} formDefinition={formDefinition} onSubmit={this.onSubmit} onCancel={this.toggleVisibility} />
        </EcosModal>

        {this.renderDebugModal()}
      </>
    );
  }
}
