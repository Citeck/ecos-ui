import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LAYOUT_TYPE, MENU_POSITION } from '../../constants/dashboard';
import { Link } from 'react-router-dom';
import './style.scss';
import classNames from 'classnames';
import { IcoBtn } from '../common/btns';

class Layout extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        width: PropTypes.string,
        widgets: PropTypes.array
      })
    ).isRequired,
    menu: PropTypes.shape({
      type: PropTypes.oneOf(Object.keys(MENU_POSITION).map(key => MENU_POSITION[key])),
      links: PropTypes.arrayOf(PropTypes.object)
    }).isRequired
  };

  static defaultProps = {};

  renderMenuItem = link => {
    return (
      <Link className="ecos-layout__menu-item" to={link.link} title={link.title} key={link.position}>
        <div className="ecos-layout__menu-item-title">{link.title}</div>
        <i className="ecos-btn__i ecos-layout__menu-item-i-next" />
        <i className="ecos-btn__i icon-drag ecos-layout__menu-item-i-drag" />
      </Link>
    );
  };

  renderMenu() {
    const {
      menu: { type, links }
    } = this.props;

    if (type === MENU_POSITION.LEFT) {
      return null;
    }

    return <div className="ecos-layout__menu">{links.map(this.renderMenuItem)}</div>;
  }

  renderColumn = (column, index) => {
    return (
      <div
        key={index}
        style={{
          flexBasis: column.width,
          minWidth: column.width
        }}
      />
    );
  };

  renderColumns() {
    const { columns } = this.props;

    if (!columns) {
      return null;
    }

    return columns.map(this.renderColumn);
  }

  render() {
    return (
      <div>
        {this.renderMenu()}
        {this.renderColumns()}
      </div>
    );
  }
}

export default Layout;
