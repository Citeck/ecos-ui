import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';

import Loader from '../Loader/Loader';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

import './style.scss';
import '../form/Dropdown/Dropdown.scss';

const MenuModes = {
  GROUP: 'group',
  CASCADE: 'cascade',
  LIST: 'list'
};

export default class DropdownMenu extends React.Component {
  static propTypes = {
    items: PropTypes.array,
    mode: PropTypes.oneOf([MenuModes.CASCADE, MenuModes.GROUP, MenuModes.LIST]),
    setGroup: PropTypes.shape({
      showGroupName: PropTypes.bool,
      showSeparator: PropTypes.bool
    }),
    setCascade: PropTypes.shape({
      collapseOneItem: PropTypes.bool
    }),
    isLoading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    childrenCascadeClassName: PropTypes.string,
    portalClassName: PropTypes.string,
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
    const {
      mode,
      items,
      setGroup,
      setCascade,
      onClick,
      isLoading,
      emptyMessage,
      childrenCascadeClassName,
      portalClassName,
      ...someProps
    } = this.props;

    if (isLoading) {
      return <Loader type="points" height={40} width={38} />;
    }

    let menu = cloneDeep(items || []);

    if (!menu.length && emptyMessage) {
      return <div className="ecos-dropdown-menu__empty">{emptyMessage}</div>;
    }

    if (mode === MenuModes.CASCADE && setCascade.collapseOneItem) {
      menu = menu.map(item => {
        if (item.items && item.items.length === 1) {
          return item.items[0];
        }

        return item;
      });
    }

    switch (mode) {
      case MenuModes.CASCADE:
        return (
          <DropdownMenuCascade
            cascadeClassName={childrenCascadeClassName}
            portalClassName={portalClassName}
            groups={menu}
            onClick={onClick}
          />
        );
      case MenuModes.GROUP: {
        const { showGroupName, showSeparator } = setGroup;

        return <DropdownMenuGroup groups={menu} showGroupName={showGroupName} showSeparator={showSeparator} />;
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
