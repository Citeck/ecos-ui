import React, { Component } from 'react';
import { Collapse } from 'reactstrap';
import Button from '../../buttons/Button/Button';
import Input from '../../form/Input';
import Grid from '../../../common/grid/Grid/Grid';
import EcosForm from '../../../EcosForm';
import SimpleModal from '../../SimpleModal';
import './SelectJournal.scss';

import fakeData from './fakedata.json';

export default class extends Component {
  state = {
    isSelectModalOpen: false,
    isCreateModalOpen: false,
    isCollapsePanelOpen: false
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

  toggleCollapsePanel = () => {
    this.setState({
      isCollapsePanelOpen: !this.state.isCollapsePanelOpen
    });
  };

  onSelect = () => {
    console.log('onSelect');
  };

  render() {
    // TODO translation !!!!!!!!
    // todo вынести переводы, formKey и т.д. наружу

    console.log('fakeData', fakeData);

    return (
      <div className="select-journal">
        <Button className={'button_blue'} onClick={this.toggleSelectModal}>
          Выбрать
        </Button>

        <SimpleModal
          title={'Выбрать юридическое лицо'}
          isOpen={this.state.isSelectModalOpen}
          hideModal={this.toggleSelectModal}
          zIndex={10002}
          className={'select-journal-select-modal simple-modal_level-1'}
        >
          <div className={'select-journal-collapse-panel'}>
            <div className={'select-journal-collapse-panel__controls'}>
              <div className={'select-journal-collapse-panel__controls-left'}>
                <Button className={'button_blue'} onClick={this.toggleCollapsePanel}>
                  Фильтр
                </Button>
                <Button className={'button_blue'} onClick={this.toggleCreateModal}>
                  Создать
                </Button>
              </div>
              <div className={'select-journal-collapse-panel__controls-right'}>
                <Input />
              </div>
            </div>

            <Collapse isOpen={this.state.isCollapsePanelOpen}>
              <p style={{ marginTop: 20 }}>TODO</p>
            </Collapse>
          </div>

          {/*<Grid*/}
          {/*{...fakeData}*/}
          {/*disableFormatters*/}
          {/*hasCheckboxes*/}
          {/*onFilter={() => console.log('onFilter')}*/}
          {/*onSelectAll={() => console.log('onSelectAll')}*/}
          {/*onSelect={() => console.log('onSelect')}*/}
          {/*onDelete={() => console.log('onDelete')}*/}
          {/*onEdit={() => console.log('onEdit')}*/}
          {/*selected={[]}*/}
          {/*selectAllRecords={null}*/}
          {/*selectAllRecordsVisible={null}*/}
          {/*/>*/}

          <div className="select-journal-select-modal__buttons">
            <Button onClick={this.toggleSelectModal}>Отмена</Button>
            <Button className={'button_blue'} onClick={this.onSelect}>
              ОK
            </Button>
          </div>
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
            // onReady={form => {
            //   console.log('Form is ready', form);
            // }}
          />
        </SimpleModal>
      </div>
    );
  }
}
