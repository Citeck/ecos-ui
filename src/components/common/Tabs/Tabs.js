import React from 'react';
import classNames from 'classnames';

import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick, hasHover, hasHint, className, isMobile } = props;
  const tabClassNames = classNames('ecos-tab', className, {
    'ecos-tab_active': isActive,
    'ecos-tab_hover': hasHover
  });
  const extraProps = {};

  if (isMobile) {
    extraProps.onMouseUp = onClick;
  } else {
    extraProps.onClick = onClick;
  }

  return (
    <div className={tabClassNames} title={hasHint ? label : ''} {...extraProps}>
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
    narrow,
    isMobile
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
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

Tabs.propTypes = commonTabsPropTypes;
Tabs.defaultProps = commonTabsDefaultProps;

export default Tabs;
