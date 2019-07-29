import React from 'react';
import classNames from 'classnames';
import { IcoBtn } from '../common/btns';

class HamburgerIcon extends React.Component {
  className = 'ecos-header-hamburger';

  render() {
    const classNameIcoBtn = classNames(
      `${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_padding_small ecos-btn_r_6`,
      'hamburger-icon-btn'
    );

    return (
      <IcoBtn icon={'icon-list-1'} className={classNameIcoBtn}>
        <label className={`${this.className}__label`} htmlFor="slide-menu-checkbox" />
      </IcoBtn>
    );
  }
}

export default HamburgerIcon;
