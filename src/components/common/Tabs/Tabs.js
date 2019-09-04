import React from 'react';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick, hasHover, className } = props;
  const tabClassNames = classNames('ecos-tab', className, {
    'ecos-tab_active': isActive,
    'ecos-tab_hover': hasHover
  });

  return (
    <div className={tabClassNames} onClick={onClick}>
      {t(label)}
    </div>
  );
};

Tab.propTypes = commonOneTabPropTypes;
Tab.defaultProps = commonOneTabDefaultProps;

const Tabs = props => {
  const { items, keyField, valueField, valuePrefix, className, classNameTab, activeTabKey, onClick, hasHover } = props;
  const tabsClassNames = classNames('ecos-tabs', className);

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
          onClick={() => onClick(index)}
          hasHover={hasHover}
        />
      ))}
    </div>
  );
};

Tabs.propTypes = commonTabsPropTypes;
Tabs.defaultProps = commonTabsDefaultProps;

export default Tabs;
