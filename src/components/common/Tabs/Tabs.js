import React from 'react';
import classNames from 'classnames';
import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

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
Tab.defaultProps = commonOneTabDefaultProps;

const Tabs = props => {
  const { items, keyField, valueField, valuePrefix, className, activeTabKey, onClick, hasHover } = props;
  const tabsClassNames = classNames('ecos-tabs', className);

  return (
    <div className={tabsClassNames}>
      {items.map((item, index) => (
        <Tab
          key={`${item[keyField]}-${index}`}
          id={item[keyField]}
          label={`${valuePrefix} ${item[valueField]}`}
          isActive={item.isActive || item[keyField] === activeTabKey}
          onClick={() => onClick(index)}
          hasHover={hasHover}
          {...item}
        />
      ))}
    </div>
  );
};
// Tabs.propTypes = commonTabsPropTypes;
// Tabs.defaultProps = commonTabsDefaultProps;

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      ...Tab.propTypes
    })
  ),
  keyField: PropTypes.string,
  valueField: PropTypes.string,
  className: PropTypes.string,
  activeTab: PropTypes.string
};

Tabs.defaultProps = {
  items: [],
  keyField: 'id',
  valueField: 'label',
  className: '',
  activeTab: '',
  valuePrefix: ''
};

export default Tabs;
