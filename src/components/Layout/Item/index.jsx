import get from 'lodash/get';
import React from 'react';

import Adaptive from './Adaptive';
import AdaptiveSameWidgets from './AdaptiveSameWidgets';
import Columns from './Columns';
import Menu from './Menu';

import { LayoutTypes } from '@/constants/layout';

export default props => {
  const menuType = get(props, 'config.menu.type', null);

  switch (true) {
    case !!menuType:
      return <Menu {...props} />;

    case props.type === LayoutTypes.ADAPTIVE_SAME_WIDGETS:
      return <AdaptiveSameWidgets {...props} />;

    case props.type === LayoutTypes.ADAPTIVE:
      return <Adaptive {...props} />;

    default:
      return <Columns {...props} />;
  }
};
