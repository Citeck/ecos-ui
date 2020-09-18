import React from 'react';

import { MenuTypes } from '../../../constants/menu';
import Base from './Base';

import '../style.scss';

export default class Menu extends Base {
  static defaultProps = {
    ...Base.defaultProps,
    config: {
      menu: null
    }
  };

  renderMenu() {
    const {
      config: { menu }
    } = this.props;
    let block = null;

    if (!menu) {
      return null;
    }

    if (menu.type === MenuTypes.LEFT) {
      block = (
        <div className="ecos-layout__menu">
          <div className="ecos-layout__menu-left" />
        </div>
      );
    }

    if (menu.type === MenuTypes.TOP) {
      block = (
        <div className="ecos-layout__menu ecos-layout__menu_top">
          <div className="ecos-layout__menu-item-template" />
          <div className="ecos-layout__menu-item-template" />
          <div className="ecos-layout__menu-item-template" />
          <div className="ecos-layout__menu-item-template" />
          <div className="ecos-layout__menu-item-template" />
          <div className="ecos-layout__menu-item-template" />
        </div>
      );
    }

    return block;
  }

  render() {
    const { onClick } = this.props;

    return (
      <div className={this.className}>
        <div className="ecos-layout__item-template ecos-layout__item-template_menu" onClick={onClick}>
          {this.renderMenu()}
          {this.renderActiveIcon()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
