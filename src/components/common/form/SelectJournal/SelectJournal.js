import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import Button from '../../buttons/Button/Button';
import Input from '../../form/Input';
import Grid from '../../../common/grid/Grid/Grid';
import EcosForm from '../../../EcosForm';
import SimpleModal from '../../SimpleModal';
import './SelectJournal.scss';

import fakeData from './fakedata.json';

export default class SelectJournal extends Component {
  state = {
    isSelectModalOpen: false,
    isCreateModalOpen: false,
    isCollapsePanelOpen: false,
    gridData: {
      ...fakeData,
      selected: []
    },
    value: []
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
    const { onChange } = this.props;
    this.setState(
      prevState => {
        return {
          value: prevState.gridData.selected,
          isSelectModalOpen: false
        };
      },
      () => {
        typeof onChange === 'function' && onChange(this.state.value);
      }
    );
  };

  onCancelSelect = () => {
    this.setState(prevState => {
      return {
        gridData: {
          ...prevState.gridData,
          selected: prevState.value
        },
        isSelectModalOpen: false
      };
    });
  };

  onSelectGridItem = value => {
    this.setState(prevState => {
      return {
        gridData: {
          ...prevState.gridData,
          selected: value.selected
        }
      };
    });
  };

  render() {
    // TODO translation !!!!!!!!
    // todo вынести переводы, formKey и т.д. наружу
    const { value, isSelectModalOpen, isCreateModalOpen, isCollapsePanelOpen, gridData } = this.state;

    return (
      <div className="select-journal">
        <div>
          {value.length > 0 ? (
            <ul className={'select-journal__values-list'}>
              {value.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className={'select-journal__value-not-selected'}>Нет</p>
          )}
        </div>

        <Button className={'button_blue'} onClick={this.toggleSelectModal}>
          Выбрать
        </Button>

        <SimpleModal
          title={'Выбрать юридическое лицо'}
          isOpen={isSelectModalOpen}
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

            <Collapse isOpen={isCollapsePanelOpen}>
              <p style={{ marginTop: 20 }}>TODO</p>
            </Collapse>
          </div>

          <div className={'select-journal-grid'}>
            <Grid
              {...gridData}
              disableFormatters
              hasCheckboxes
              // hasInlineTools
              onFilter={() => console.log('onFilter')}
              onSelectAll={() => console.log('onSelectAll')}
              onSelect={this.onSelectGridItem}
              onDelete={() => console.log('onDelete')}
              onEdit={() => console.log('onEdit')}
              selectAllRecords={null}
              selectAllRecordsVisible={null}
              // className={props.loading ? 'grid_transparent' : ''}
              onEmptyHeight={() => console.log('onEmptyHeight')}
              // minHeight={100}
              // emptyRowsCount={3}
            />
          </div>

          <div className="select-journal-select-modal__buttons">
            <Button onClick={this.onCancelSelect}>Отмена</Button>
            <Button className={'button_blue'} onClick={this.onSelect}>
              ОK
            </Button>
          </div>
        </SimpleModal>

        <SimpleModal
          title={'Создать юридическое лицо'}
          isOpen={isCreateModalOpen}
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

SelectJournal.propTypes = {
  onChange: PropTypes.func
};
