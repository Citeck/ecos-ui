import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';

import RightMenu from '../../../../src/components/BPMNDesigner/RightMenu';
import '../../../../src/components/BPMNDesigner/RightMenu/RightMenu.module.scss';

export const render = (elementId, props) => {
  console.log('Hey!');

  ReactDOM.render(
    <RightMenu { ...props } />,
    document.getElementById(elementId)
  );
};

export default RightMenu;
