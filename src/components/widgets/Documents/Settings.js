import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { EcosModal, Search } from '../../common';
import { Btn } from '../../common/btns';
import Tree from './Tree';
import { deepClone, t, arrayCompare } from '../../../helpers/util';

class Settings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool
  };

  static defaultProps = {
    isOpen: false
  };

  constructor(props) {
    super(props);

    this.state = {
      types: props.types,
      filter: ''
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.isOpen && !arrayCompare(props.types, state.types)) {
      return { types: props.types };
    }

    return null;
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

  handleCloseModal = () => {
    this.props.onClose();

    this.setState({ filter: '' });
  };

  handleClickSave = () => {
    const types = deepClone(this.state.types);
    const selected = [];

    const checkStatus = item => {
      if (item.isSelected) {
        selected.push(item.id);
      }

      if (get(item, 'items', []).length) {
        item.items.forEach(checkStatus);
      }
    };

    types.forEach(checkStatus);

    this.props.onSave(selected);
  };

  handleToggleSelectType = ({ id, checked }) => {
    const types = deepClone(this.state.types);
    const findItem = item => {
      if (item.id === id) {
        item.isSelected = checked;

        return item;
      }

      if (get(item, 'items', []).length) {
        return item.items.find(findItem);
      }
    };

    types.find(findItem);

    this.setState({ types });
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ filter: filter.toLowerCase() });
  };

  render() {
    const { isOpen, title } = this.props;

    return (
      <EcosModal title={title} isOpen={isOpen} className="ecos-docs__modal-settings" hideModal={this.handleCloseModal}>
        <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTypes} className="ecos-docs__modal-settings-search" />
        <div className="ecos-docs__modal-settings-field">
          <Tree
            // groupBy="parent"
            data={this.availableTypes}
            toggleSelect={this.handleToggleSelectType}
          />
        </div>

        <div>
          <Btn onClick={this.handleCloseModal}>{t('select-orgstruct.select-modal.cancel-button')}</Btn>
          <Btn onClick={this.handleClickSave} className={'ecos-btn_blue'}>
            {t('select-orgstruct.select-modal.ok-button')}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default Settings;
