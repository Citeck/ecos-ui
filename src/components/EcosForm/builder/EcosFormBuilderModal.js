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

import './style.scss';
import EcosForm from '..';

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
      formIdValue: null
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

  componentDidUpdate(prevProps) {
    if (prevProps.formIdValue !== this.props.formIdValue && this.props.formIdValue !== undefined) {
      this.setState({ formIdValue: this.props.formIdValue });
    }
  }

  setTitle() {
    return this.state.formIdValue ? <div>ID: {this.state.formIdValue}</div> : null;
  }

  toggleVisibility = () => {
    DialogManager.confirmDialog({
      text: t(Labels.CLOSE_CONFIRM_DESCRIPTION),
      onYes: () => {
        this.setState(({ isModalOpen }) => ({
          isModalOpen: !isModalOpen
        }));
      }
    });
  };

  onSubmit = form => {
    if (this.state.onSubmit) {
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
    const { isModalOpen, formDefinition } = this.state;

    return (
      <>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-extra-lg"
          title={t('eform.modal.title.constructor')}
          isOpen={isModalOpen}
          zIndex={9000}
          hideModal={this.toggleVisibility}
          customButtons={this.renderCustomButtons()}
        >
          {this.setTitle()}
          <EcosFormBuilder formDefinition={formDefinition} onSubmit={this.onSubmit} onCancel={this.toggleVisibility} />
        </EcosModal>

        {this.renderDebugModal()}
      </>
    );
  }
}
