import React from 'react';
import classNames from 'classnames';
import { commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick, hasHover } = props;
  const tabClassNames = classNames('ecos-tab', {
    'ecos-tab_active': isActive,
    'ecos-tab_hover': hasHover
  });

  return (
    <div className={tabClassNames} onClick={onClick}>
      {label}
    </div>
  );
};

Tab.propTypes = commonOneTabPropTypes;

const Tabs = props => {
  const { items, className, hasHover } = props;
  const tabsClassNames = classNames('ecos-tabs', className);

  return (
    <div className={tabsClassNames}>
      {items.map((item, index) => {
        return <Tab key={`${item.id}-${index}`} {...item} hasHover={hasHover} />;
      })}
    </div>
  );
};

Tabs.propTypes = commonTabsPropTypes;

Tabs.defaultProps = commonTabsDefaultProps;

export default Tabs;
