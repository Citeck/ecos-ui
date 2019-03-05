import React, { Component } from 'react';
import Button from '../../buttons/Button/Button';
import EcosForm from '../../../EcosForm';
import SimpleModal from '../../SimpleModal';

export default class extends Component {
  state = {
    isSelectModalOpen: false,
    isCreateModalOpen: false
  };

  toggleSelectModal = () => {
    this.setState({
      isSelectModalOpen: !this.state.isSelectModalOpen
    });
  };

  toggleCreateModal = () => {
    this.setState({
      isCreateModalOpen: !this.state.isCreateModalOpen
    });
  };

  render() {
    // TODO translation !!!!!!!!
    // todo вынести переводы, formKey и т.д. наружу

    return (
      <div>
        <Button className={'button_blue'} onClick={this.toggleSelectModal}>
          Выбрать
        </Button>

        <SimpleModal
          title={'Выбрать юридическое лицо'}
          isOpen={this.state.isSelectModalOpen}
          hideModal={this.toggleSelectModal}
          zIndex={10002}
          className={'simple-modal_level-1'}
        >
          <Button className={'button_blue'} onClick={this.toggleCreateModal}>
            Создать
          </Button>
        </SimpleModal>

        <SimpleModal
          title={'Создать юридическое лицо'}
          isOpen={this.state.isCreateModalOpen}
          hideModal={this.toggleCreateModal}
          zIndex={10003}
          className={'simple-modal_level-2'}
        >
          <EcosForm
            record={'CREATE_JOURNAL@'}
            formKey={'CREATE_JOURNAL'}
            onSubmit={e => {
              console.log('Form submitted', e);
            }}
            onFormCancel={this.toggleCreateModal}
            onReady={form => {
              console.log('Form is ready', form);
            }}
          />
        </SimpleModal>
      </div>
    );
  }
}
