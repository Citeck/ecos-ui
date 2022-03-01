import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { flattenComponents } from 'formiojs/utils/formUtils';

import EcosFormBuilder from './EcosFormBuilder';
import EcosModal from '../../common/EcosModal';
import DialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/export/util';
import { Icon } from '../../common';
import DebugModal from './DebugModal';

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
      isOpenInfluence: true
    };
  }

  show(formDefinition, onSubmit) {
    this.setState({
      isModalOpen: true,
      formDefinition: cloneDeep(formDefinition),
      onSubmit
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

    return (
      <>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-extra-lg"
          title="Form Builder"
          isOpen={this.state.isModalOpen}
          zIndex={9000}
          hideModal={toggleVisibility}
          customButtons={this.renderCustomButtons()}
        >
          <EcosFormBuilder formDefinition={this.state.formDefinition} onSubmit={onSubmit} onCancel={toggleVisibility} />
        </EcosModal>

        {this.renderDebugModal()}
      </>
    );
  }
}
