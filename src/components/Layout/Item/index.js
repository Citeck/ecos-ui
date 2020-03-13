import React from 'react';
import get from 'lodash/get';

import Adaptive from './Adaptive';
import Columns from './Columns';
import Menu from './Menu';
import { LAYOUT_TYPE } from '../../../constants/layout';

export default props => {
  const menuType = get(props, 'config.menu.type', null);

  if (menuType) {
    return <Menu {...props} />;
  }

  if (props.type === LAYOUT_TYPE.ADAPTIVE) {
    return <Adaptive {...props} />;
  }

  return <Columns {...props} />;
};
