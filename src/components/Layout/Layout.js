import React from 'react';
import PropTypes from 'prop-types';
import { LAYOUT_TYPE, MENU_POSITION } from '../../constants/dashboard';
import './style.scss';

export default class Layout extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    active: PropTypes.bool,
    config: PropTypes.object,
    type: PropTypes.oneOf(Object.keys(LAYOUT_TYPE).map(key => LAYOUT_TYPE[key])),
    description: PropTypes.string,
    onClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    active: false,
    config: {
      columns: [{}, { width: '25%' }],
      menu: null
    },
    type: LAYOUT_TYPE.TEMPLATE,
    description: '',
    onClick: () => null
  };

  constructor(props) {
    super(props);
  }

  get className() {
    const { className, active } = this.props;
    const classes = ['ecos-layout__item'];

    if (className) {
      classes.push(className);
    }

    if (active) {
      classes.push('ecos-layout__item_active');
    }

    return classes.join(' ');
  }

  renderActiveIcon() {
    const { active } = this.props;

    if (!active) {
      return null;
    }

    return <i className="ecos-layout__item_active-icon fa fa-check-circle" />;
  }

  renderColumn = (params, index) => {
    return (
      <div
        key={index}
        className="ecos-layout__column"
        style={{
          flexBasis: params.width,
          minWidth: params.width
        }}
      />
    );
  };

  renderColumns() {
    const {
      config: { columns }
    } = this.props;

    if (!columns) {
      return null;
    }

    return columns.map(this.renderColumn);
  }

  renderMenu() {
    const {
      config: { menu }
    } = this.props;
    let block = null;

    if (!menu) {
      return null;
    }

    if (menu.type === MENU_POSITION.LEFT) {
      block = (
        <div className="ecos-layout__menu">
          <div className="ecos-layout__menu-left" />
        </div>
      );
    }

    if (menu.type === MENU_POSITION.TOP) {
      block = (
        <div className="ecos-layout__menu ecos-layout__menu_top">
          <div className="ecos-layout__menu-item" />
          <div className="ecos-layout__menu-item" />
          <div className="ecos-layout__menu-item" />
          <div className="ecos-layout__menu-item" />
          <div className="ecos-layout__menu-item" />
          <div className="ecos-layout__menu-item" />
        </div>
      );
    }

    return block;
  }

  renderDescription() {
    const { description } = this.props;

    if (!description) {
      return null;
    }

    return <div className="ecos-layout__item-description">{description}</div>;
  }

  render() {
    const { onClick } = this.props;

    return (
      <div onClick={onClick} className={this.className}>
        <div className="ecos-layout__item-template">
          {this.renderColumns()}
          {this.renderMenu()}
          {this.renderActiveIcon()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
