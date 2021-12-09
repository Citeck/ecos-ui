import React from 'react';
import cloneDeep from 'lodash/cloneDeep';

import EcosFormBuilder from './EcosFormBuilder';
import EcosModal from '../../common/EcosModal';
import DialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/export/util';

const Labels = {
  CLOSE_CONFIRM_DESCRIPTION: 'ecos-form.builder.confirm-close.description'
};

export default class EcosFormBuilderModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formDefinition: {},
      isModalOpen: false
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

  render() {
    let onSubmit = this.onSubmit.bind(this);
    let toggleVisibility = this.toggleVisibility.bind(this);

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-extra-lg"
        title={'Form Builder'}
        isOpen={this.state.isModalOpen}
        zIndex={9000}
        hideModal={toggleVisibility}
      >
        <EcosFormBuilder formDefinition={this.state.formDefinition} onSubmit={onSubmit} onCancel={toggleVisibility} />
      </EcosModal>
    );
  }
}
