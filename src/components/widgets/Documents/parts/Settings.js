import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { EcosModal, Search } from '../../../common';
import { Btn } from '../../../common/btns';
import Tree from './Tree';
import TypeSettings from './TypeSettings';
import { GrouppedTypeInterface, TypeSettingsInterface } from '../propsInterfaces';
import { arrayFlat, t } from '../../../../helpers/util';
import { Checkbox } from '../../../common/form';

const Labels = {
  CANCEL_BUTTON: 'documents-widget.settings-modal.button.cancel',
  OK_BUTTON: 'documents-widget.settings-modal.button.ok',
  CHECKLIST: 'documents-widget.settings-modal.checklist',
  SHOW_ONLY_CHECKED: 'documents-widget.settings-modal.show-only-checked'
};

class Settings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isLoadChecklist: PropTypes.bool,
    isLoadingTypeSettings: PropTypes.bool,
    title: PropTypes.string,
    typeSettings: PropTypes.shape(TypeSettingsInterface),
    types: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface)),
    onCancel: PropTypes.func,
    onSave: PropTypes.func,
    onEditType: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    isLoading: false,
    isLoadChecklist: false,
    isLoadingTypeSettings: false,
    title: '',
    types: [],
    onCancel: () => {},
    onSave: () => {},
    onEditType: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      types: props.types,
      filter: '',
      isLoadChecklist: props.isLoadChecklist,
      isOnlySelected: props.isOnlySelected,
      editableType: null,
      customizedTypeSettings: new Map()
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!props.isOpen && !isEqual(props.types, state.types)) {
      newState.types = props.types;
    }

    if (!props.isOpen && props.isLoadChecklist !== state.isLoadChecklist) {
      newState.isLoadChecklist = props.isLoadChecklist;
    }

    if (!props.isOpen && state.filter) {
      newState.filter = '';
    }

    if (!props.isOpen && state.customizedTypeSettings.size) {
      newState.customizedTypeSettings = new Map();
    }

    if (props.isOpen && isEmpty(state.types) && !isEmpty(props.types)) {
      newState.types = props.types;
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  get availableTypes() {
    const { filter, types, isOnlySelected } = this.state;

    if (isOnlySelected) {
      const flatArray = arrayFlat({ data: types, byField: 'items', withParent: true }) || [];

      return cloneDeep(flatArray).filter(item => {
        if (item.isSelected) {
          item.items = [];

          if (filter) {
            item.filter = filter;

            return item.name.toLowerCase().includes(filter);
          }

          return true;
        }

        return false;
      });
    }

    if (!filter) {
      return types;
    }

    const check = originTypes => {
      const types = cloneDeep(originTypes);

      const checkName = type => {
        if (isEmpty(type.name)) {
          return false;
        }

        return type.name.toLowerCase().includes(filter);
      };

      return types
        .map(type => {
          type.filter = filter;

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
        .filter(item => {
          if (item === null) {
            return false;
          }

          if (isOnlySelected) {
            return item.isSelected;
          }

          return true;
        });
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

  get typeSettings() {
    const { typeSettings } = this.props;
    const { customizedTypeSettings, editableType } = this.state;

    if (customizedTypeSettings.has(editableType)) {
      return customizedTypeSettings.get(editableType);
    }

    return typeSettings;
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

    const types = cloneDeep(this.state.types);
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
    this.setState({
      filter: '',
      customizedTypeSettings: new Map()
    });

    this.props.onCancel();
  };

  handleClickSave = () => {
    const { isLoadChecklist, types: originTypes } = this.state;
    const types = cloneDeep(originTypes);
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
    const { filter: oldFilter } = this.state;

    if (oldFilter && filter) {
      // needed for expand previously collapsed tree elements
      this.setState({ filter: '' }, () => {
        this.setState({ filter: filter.toLowerCase() });
      });

      return;
    }

    this.setState({ filter: filter.toLowerCase() });
  };

  handleToggleTypeSettings = (type = null) => {
    this.setState({ editableType: type });

    if (type && !this.state.customizedTypeSettings.has(type)) {
      this.props.onEditType(type);
    }
  };

  handleSaveTypeSettings = (settings = {}) => {
    this.setTypeData(this.state.editableType, settings);
    this.setState(state => ({
      customizedTypeSettings: state.customizedTypeSettings.set(state.editableType, settings),
      editableType: null
    }));
  };

  handleToggleLoadChecklist = ({ checked }) => {
    this.setState({ isLoadChecklist: checked });
  };

  handleToggleShowOnly = ({ checked }) => {
    this.setState({ isOnlySelected: checked });
  };

  render() {
    const { isOpen, title, isLoading, isLoadingTypeSettings } = this.props;
    const { editableType, isLoadChecklist, filter, isOnlySelected } = this.state;

    return (
      <>
        <EcosModal
          title={title}
          isOpen={isOpen}
          isLoading={isLoading}
          className="ecos-docs__modal-settings ecos-modal_width-extra-lg"
          hideModal={this.handleCloseModal}
        >
          <Checkbox className="ecos-docs__modal-checkbox" onChange={this.handleToggleLoadChecklist} checked={isLoadChecklist}>
            {t(Labels.CHECKLIST)}
          </Checkbox>

          <Checkbox className="ecos-docs__modal-checkbox" onChange={this.handleToggleShowOnly} checked={isOnlySelected}>
            {t(Labels.SHOW_ONLY_CHECKED)}
          </Checkbox>

          <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTypes} className="ecos-docs__modal-settings-search" />
          <div className="ecos-docs__modal-settings-field">
            <Tree
              data={this.availableTypes}
              isOpenAll={!isEmpty(filter)}
              onToggleSelect={this.handleToggleSelectType}
              onOpenSettings={this.handleToggleTypeSettings}
            />
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
          isLoading={isLoadingTypeSettings}
          type={this.editableType}
          settings={this.typeSettings}
          isOpen={editableType !== null}
          onCancel={this.handleToggleTypeSettings}
          onSave={this.handleSaveTypeSettings}
        />
      </>
    );
  }
}

export default Settings;
