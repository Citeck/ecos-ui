import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
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
  DEBUG_TITLE: 'ecos-form.builder.debugging.title'
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

  hide() {
    this.setState({
      isModalOpen: false
    });
  }

  toggleVisibility = () => {
    DialogManager.confirmDialog({
      text: t(Labels.CLOSE_CONFIRM_DESCRIPTION),
      onYes: () => {
        this.setState(state => ({
          isModalOpen: !state.isModalOpen
        }));

        clearFormFromCache(this.state.formId);
      }
    });
  };

  onSubmit(form) {
    if (this.state.onSubmit) {
      this.state.onSubmit(form);
    }
    this.hide();
  }

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
    let onSubmit = this.onSubmit.bind(this);
    let toggleVisibility = this.toggleVisibility.bind(this);
    const { isModalOpen, formDefinition, options } = this.state;

    return (
      <>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-extra-lg"
          title="Form Builder"
          isOpen={isModalOpen}
          zIndex={9000}
          hideModal={toggleVisibility}
          customButtons={this.renderCustomButtons()}
        >
          <EcosFormBuilder options={options} formDefinition={formDefinition} onSubmit={onSubmit} onCancel={toggleVisibility} />
        </EcosModal>

        {this.renderDebugModal()}
      </>
    );
  }
}
