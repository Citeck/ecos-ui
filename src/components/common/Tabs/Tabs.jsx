import classNames from 'classnames';
import get from 'lodash/get';
import isString from 'lodash/isString';
import React from 'react';

import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import { getCurrentLocale } from '@/helpers/util';

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
      <span>{label}</span>
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
      {items.map((item, index) => {
        const labelField = item[valueField];
        const label = isString(labelField) ? labelField : get(labelField, getCurrentLocale(), '');

        if (!!get(item, 'isEmpty', false)) {
          return null;
        }

        return (
          <Tab
            {...item}
            key={`${item[keyField]}-${index}`}
            className={classNameTab}
            id={item[keyField]}
            label={classNames(valuePrefix, label)}
            isActive={item.isActive || item[keyField] === activeTabKey}
            onClick={onClick ? () => onClick(index) : item.onClick}
            hasHover={hasHover}
            hasHint={hasHint}
            isMobile={isMobile}
          />
        );
      })}
    </div>
  );
};

Tabs.propTypes = commonTabsPropTypes;
Tabs.defaultProps = commonTabsDefaultProps;

export default Tabs;
