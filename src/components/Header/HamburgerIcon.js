import React from 'react';
import { IcoBtn } from '../common/btns';

class HamburgerIcon extends React.Component {
  render() {
    return (
      <IcoBtn icon={'icon-list-1'} className="hamburger-icon-btn ecos-header-hamburger__btn ecos-btn_transparent ecos-btn_color_white">
        <label className="ecos-header-hamburger__label" htmlFor="slide-menu-checkbox" />
      </IcoBtn>
    );
  }
}

export default HamburgerIcon;
