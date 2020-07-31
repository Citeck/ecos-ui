import React from 'react';
import get from 'lodash/get';

import { LayoutTypes } from '../../../constants/layout';
import Adaptive from './Adaptive';
import Columns from './Columns';
import Menu from './Menu';

export default props => {
  const menuType = get(props, 'config.menu.type', null);

  if (menuType) {
    return <Menu {...props} />;
  }

  if (props.type === LayoutTypes.ADAPTIVE) {
    return <Adaptive {...props} />;
  }

  return <Columns {...props} />;
};
