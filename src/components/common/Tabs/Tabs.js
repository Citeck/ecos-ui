import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick } = props;
  const tabClassNames = classNames('ecos-tab', {
    'ecos-tab_active': isActive
  });

  return (
    <div className={tabClassNames} onClick={onClick}>
      {label}
    </div>
  );
};

Tab.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func
};

const Tabs = props => {
  const { items, keyField, valueField, valuePrefix, className, activeTabKey, onClick } = props;
  const tabsClassNames = classNames('ecos-tabs', className);

  return (
    <div className={tabsClassNames}>
      {items.map((item, index) => (
        <Tab
          key={item[keyField]}
          id={item[keyField]}
          label={`${valuePrefix} ${item[valueField]}`}
          isActive={item.isActive || item[keyField] === activeTabKey}
          onClick={() => onClick(index)}
          {...item}
        />
      ))}
    </div>
  );
};

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
