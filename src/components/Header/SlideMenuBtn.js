import React from 'react';
import { Icon } from '../common';

class SlideMenuBtn extends React.Component {
  render() {
    return (
      <span id="slide-menu-toggle" className="ecos-header-hamburger">
        <Icon className="icon-hamburger-menu" />
      </span>
    );
  }
}

export default SlideMenuBtn;
