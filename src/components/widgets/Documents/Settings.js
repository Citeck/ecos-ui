import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { EcosModal, Search } from '../../common';
import { Btn } from '../../common/btns';
import Tree from './Tree';
import TypeSettings from './TypeSettings';
import { GrouppedTypeInterface } from './propsInterfaces';
import { deepClone, t, arrayCompare } from '../../../helpers/util';
import { Checkbox } from '../../common/form';

const Labels = {
  CANCEL_BUTTON: 'documents-widget.settings-modal.button.cancel',
  OK_BUTTON: 'documents-widget.settings-modal.button.ok',
  CHECKLIST: 'documents-widget.settings-modal.checklist'
};

class Settings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isLoadChecklist: PropTypes.bool,
    title: PropTypes.string,
    types: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface)),
    onCancel: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    isLoading: false,
    isLoadChecklist: false,
    title: '',
    types: [],
    onCancel: () => {},
    onSave: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      types: props.types,
      filter: '',
      isLoadChecklist: props.isLoadChecklist,
      editableType: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!props.isOpen && !arrayCompare(props.types, state.types)) {
      newState.types = props.types;
    }

    if (!props.isOpen && props.isLoadChecklist !== state.isLoadChecklist) {
      newState.isLoadChecklist = props.isLoadChecklist;
    }

    if (!props.isOpen && state.filter) {
      newState.filter = '';
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  get availableTypes() {
    const { filter, types } = this.state;

    if (!filter) {
      return types;
    }

    const check = originTypes => {
      const types = deepClone(originTypes);
      const checkName = type => type.name.toLowerCase().includes(filter);

      return types
        .map(type => {
          if (!type.items.length) {
            if (checkName(type)) {
              return type;
            }

            return null;
          }

          const items = check(type.items);

          if (!items.length) {
            type.items = [];

            return checkName(type) ? type : null;
          }

          return {
            ...type,
            items
          };
        })
        .filter(item => item !== null);
    };

    return check(types);
  }

  get editableType() {
    const { editableType } = this.state;

    if (editableType === null) {
      return null;
    }

    return this.getType(editableType);
  }

  getType = (id, types = this.state.types) => {
    let type = {};
    const searchItem = item => {
      if (item.id === id) {
        type = item;
        return;
      }

      if (get(item, 'items', []).length) {
        item.items.forEach(searchItem);
      }
    };

    types.forEach(searchItem);

    return type;
  };

  setTypeData = (id = null, data = {}) => {
    if (id === null) {
      return;
    }

    const types = deepClone(this.state.types);
    const checkItem = item => {
      if (item.id === id) {
        Object.keys(data).forEach(key => {
          item[key] = data[key];
        });

        return item;
      }

      if (get(item, 'items', []).length) {
        return item.items.forEach(checkItem);
      }
    };

    types.forEach(checkItem);

    this.setState({ types });
  };

  handleCloseModal = () => {
    this.setState({ filter: '' });

    this.props.onCancel();
  };

  handleClickSave = () => {
    const { isLoadChecklist } = this.state;
    const types = deepClone(this.state.types);
    const selected = [];

    const checkStatus = item => {
      if (item.isSelected) {
        selected.push(item);
      }

      if (get(item, 'items', []).length) {
        item.items.forEach(checkStatus);
      }
    };

    types.forEach(checkStatus);
    this.props.onSave({ types: selected, isLoadChecklist });
  };

  handleToggleSelectType = ({ id, checked }) => {
    this.setTypeData(id, { isSelected: checked });
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ filter: filter.toLowerCase() });
  };

  handleToggleTypeSettings = (type = null) => {
    this.setState({ editableType: type });
  };

  handleSaveTypeSettings = (settings = {}) => {
    this.setTypeData(this.state.editableType, settings);
    this.setState({ editableType: null });
  };

  handleToggleLoadChecklist = ({ checked }) => {
    this.setState({ isLoadChecklist: checked });
  };

  render() {
    const { isOpen, title, isLoading } = this.props;
    const { editableType, isLoadChecklist } = this.state;

    return (
      <>
        <EcosModal
          title={title}
          isOpen={isOpen}
          isLoading={isLoading}
          className="ecos-docs__modal-settings"
          hideModal={this.handleCloseModal}
        >
          <Checkbox className="ecos-docs__modal-checklist" onChange={this.handleToggleLoadChecklist} checked={isLoadChecklist}>
            {t(Labels.CHECKLIST)}
          </Checkbox>
          <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTypes} className="ecos-docs__modal-settings-search" />
          <div className="ecos-docs__modal-settings-field">
            <Tree data={this.availableTypes} onToggleSelect={this.handleToggleSelectType} onOpenSettings={this.handleToggleTypeSettings} />
          </div>

          <div className="ecos-docs__modal-settings-footer">
            <Btn onClick={this.handleCloseModal} className="ecos-docs__modal-settings-footer-item">
              {t(Labels.CANCEL_BUTTON)}
            </Btn>
            <Btn onClick={this.handleClickSave} className="ecos-btn_blue ecos-docs__modal-settings-footer-item">
              {t(Labels.OK_BUTTON)}
            </Btn>
          </div>
        </EcosModal>
        <TypeSettings
          type={this.editableType}
          isOpen={editableType !== null}
          onCancel={this.handleToggleTypeSettings}
          onSave={this.handleSaveTypeSettings}
        />
      </>
    );
  }
}

export default Settings;
