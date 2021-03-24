import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import DropdownMenuItem from './DropdownMenuItem';

export default class DropdownMenuCascade extends React.Component {
  static propTypes = {
    groups: PropTypes.array,
    className: PropTypes.string,
    onClick: PropTypes.func
  };

  static defaultProps = {
    groups: []
  };

  #portalElement;

  state = {
    openedItem: null
  };

  constructor(props) {
    super(props);

    this.#portalElement = document.createElement('div');
  }

  componentDidMount() {
    document.body.appendChild(this.#portalElement);
  }

  componentWillUnmount() {
    document.body.removeChild(this.#portalElement);
  }

  toggle = key => {
    this.setState({ openedItem: key });
  };

  renderMenuItems = items => {
    return isEmpty(items)
      ? []
      : items.map((item, key) => {
          return <DropdownMenuItem key={key} data={item} />;
        });
  };

  render() {
    const { groups, onClick, className } = this.props;
    const { openedItem } = this.state;

    return groups.map((item, i) => {
      const { id, items } = item;
      const key = `key-${i}-${id}`;
      const iconRight = classNames({ 'icon-small-right ecos-dropdown-menu__cascade-arrow': !isEmpty(items) });

      return (
        <Dropdown
          className="ecos-dropdown ecos-dropdown-menu__cascade"
          key={key}
          isOpen={openedItem === key}
          toggle={() => null}
          direction="right"
        >
          <DropdownToggle
            tag="ul"
            className="ecos-dropdown__toggle ecos-dropdown-menu__cascade-toggle"
            onMouseEnter={() => this.toggle(key)}
          >
            <DropdownMenuItem data={item} iconRight={iconRight} onClick={item.items ? () => null : onClick} />
          </DropdownToggle>

          {ReactDOM.createPortal(
            <DropdownMenu
              className={classNames('ecos-dropdown__menu ecos-dropdown__menu_cascade', className)}
              modifiers={{
                preventOverflow: {
                  boundariesElement: 'viewport',
                  escapeWithReference: false
                }
              }}
            >
              {item.items ? <DropdownMenuCascade groups={item.items} onClick={onClick} /> : <ul>{this.renderMenuItems(items)}</ul>}
            </DropdownMenu>,
            this.#portalElement
          )}
        </Dropdown>
      );
    });
  }
}
