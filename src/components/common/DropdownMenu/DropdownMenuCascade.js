import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import DropdownMenuItem from './DropdownMenuItem';

export default class DropdownMenuCascade extends React.Component {
  static propTypes = {
    groups: PropTypes.array
  };

  static defaultProps = {
    groups: []
  };

  className = 'ecos-dropdown-menu__cascade';

  state = {
    openedItem: null
  };

  toggle = key => {
    this.setState({ openedItem: key });
  };

  renderMenuItems(items) {
    return isEmpty(items)
      ? []
      : items.map((item, key) => {
          return <DropdownMenuItem key={key} data={item} />;
        });
  }

  render() {
    const { groups } = this.props;
    const { openedItem } = this.state;

    return groups.map((item, i) => {
      const { id, items } = item;
      const key = `key-${i}-${id}`;
      const iconRight = classNames({ [`icon-right ${this.className}-arrow`]: !isEmpty(items) });

      return (
        <Dropdown className={`ecos-dropdown ${this.className}`} key={key} isOpen={openedItem === key} toggle={() => null} direction="right">
          <DropdownToggle tag="ul" className={`ecos-dropdown__toggle ${this.className}-toggle`} onPointerOver={() => this.toggle(key)}>
            <DropdownMenuItem data={item} iconRight={iconRight} />
          </DropdownToggle>
          <DropdownMenu className={`ecos-dropdown__menu ecos-dropdown__menu_cascade`}>
            <ul>{this.renderMenuItems(items)}</ul>
          </DropdownMenu>
        </Dropdown>
      );
    });
  }
}
