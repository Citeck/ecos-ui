import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import Loader from '../Loader/Loader';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

import './style.scss';
import '../form/Dropdown/Dropdown.scss';

const MenuModes = {
  GROUP: 'group',
  CASCADE: 'cascade',
  LIST: 'list',
  CUSTOM: 'custom'
};

export default class EcosDropdownMenu extends React.Component {
  static propTypes = {
    items: PropTypes.array,
    mode: PropTypes.oneOf(Object.keys(MenuModes).map(key => MenuModes[key])),
    setGroup: PropTypes.shape({
      showGroupName: PropTypes.bool,
      showSeparator: PropTypes.bool,
      showEmptyGroup: PropTypes.bool
    }),
    setCascade: PropTypes.shape({
      collapseOneItem: PropTypes.bool
    }),
    isLoading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    onClick: PropTypes.func
  };

  static defaultProps = {
    items: [],
    mode: MenuModes.LIST,
    setGroup: {
      showGroupName: false,
      showSeparator: false
    },
    setCascade: {
      collapseOneItem: false
    },
    emptyMessage: '',
    isLoading: false
  };

  renderMode() {
    const { mode, items, setGroup, setCascade, onClick, isLoading, emptyMessage, modifiers, ...someProps } = this.props;

    if (isLoading) {
      return <Loader type="points" height={40} width={38} />;
    }

    let menu = cloneDeep(items || []);

    if (!menu.length && emptyMessage) {
      return <div className="ecos-dropdown-menu__empty">{emptyMessage}</div>;
    }

    if (mode === MenuModes.CASCADE && setCascade.collapseOneItem) {
      menu = menu.map(item => (get(item, 'items.length') === 1 ? item.items[0] : item));
    }

    if (mode === MenuModes.GROUP && setGroup.showEmptyGroup) {
      menu = menu.filter(item => !!get(item, 'items.length'));
    }

    switch (mode) {
      case MenuModes.CASCADE:
        return <DropdownMenuCascade groups={menu} onClick={onClick} modifiers={modifiers} />;
      case MenuModes.GROUP: {
        return <DropdownMenuGroup groups={menu} onClick={onClick} {...setGroup} />;
      }
      case MenuModes.CUSTOM: {
        const { renderItem } = someProps;

        if (!isFunction(renderItem)) {
          return null;
        }

        return menu.map(renderItem);
      }
      case MenuModes.LIST:
      default:
        return menu.map((item, key) => <DropdownMenuItem key={key} data={item} onClick={onClick} {...someProps} />);
    }
  }

  render() {
    return (
      <div
        className={classNames('ecos-dropdown-menu', {
          'ecos-dropdown-menu_loading': this.props.isLoading
        })}
      >
        {this.renderMode()}
      </div>
    );
  }
}
