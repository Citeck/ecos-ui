import React from 'react';
import classNames from 'classnames';
import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick, hasHover, hasHint, className } = props;
  const tabClassNames = classNames('ecos-tab', className, {
    'ecos-tab_active': isActive,
    'ecos-tab_hover': hasHover
  });

  return (
    <div className={tabClassNames} onClick={onClick} title={hasHint ? label : ''}>
      {label}
    </div>
  );
};

Tab.propTypes = commonOneTabPropTypes;
Tab.defaultProps = commonOneTabDefaultProps;

const Tabs = props => {
  const {
    items,
    keyField,
    valueField,
    valuePrefix,
    className,
    classNameTab,
    activeTabKey,
    onClick,
    hasHover,
    hasHint,
    widthFull,
    narrow
  } = props;
  const tabsClassNames = classNames('ecos-tabs', className, { 'ecos-tabs_width-full': widthFull, 'ecos-tabs_narrow': narrow });

  return (
    <div className={tabsClassNames}>
      {items.map((item, index) => (
        <Tab
          {...item}
          key={`${item[keyField]}-${index}`}
          className={classNameTab}
          id={item[keyField]}
          label={classNames(valuePrefix, item[valueField])}
          isActive={item.isActive || item[keyField] === activeTabKey}
          onClick={onClick ? () => onClick(index) : item.onClick}
          hasHover={hasHover}
          hasHint={hasHint}
        />
      ))}
    </div>
  );
};

Tabs.propTypes = commonTabsPropTypes;
Tabs.defaultProps = commonTabsDefaultProps;

export default Tabs;
