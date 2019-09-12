import React from 'react';
import { IcoBtn } from '../common/btns';

class HamburgerIcon extends React.Component {
  render() {
    return (
      <IcoBtn
        icon={'icon-list-1'}
        className="ecos-header-hamburger__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_padding_small ecos-btn_r_6"
      >
        <label className="ecos-header-hamburger__label" htmlFor="slide-menu-checkbox" />
      </IcoBtn>
    );
  }
}

export default HamburgerIcon;
