import React from 'react';
import { MENU_POSITION } from '../../constants/dashboardSettings';
import './style.scss';
import BaseLayoutItem from './BaseLayoutItem';

export default class MenuLayoutItem extends BaseLayoutItem {
  static defaultProps = {
    ...BaseLayoutItem.defaultProps,
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
        <div className="ecos-layout__item-template" onClick={onClick}>
          {this.renderMenu()}
          {this.renderActiveIcon()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
