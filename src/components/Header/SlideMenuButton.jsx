import React from 'react';

import { Icon } from '../common';

class SlideMenuButton extends React.Component {
  render() {
    return (
      <span id="slide-menu-toggle" className="ecos-header-hamburger">
        <Icon className="icon-hamburger-menu" />
      </span>
    );
  }
}

export default SlideMenuButton;
