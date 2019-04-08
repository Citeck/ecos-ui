import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Tabs.scss';

const Tab = props => {
  const { label, isActive, onClick } = props;
  const tabClassNames = classNames('ecos-tab', {
    'ecos-tab_selected': isActive
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
  const { items, className } = props;
  const tabsClassNames = classNames('ecos-tabs', className);

  return (
    <div className={tabsClassNames}>
      {items.map(item => {
        return <Tab key={item.id} {...item} />;
      })}
    </div>
  );
};

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      ...Tab.propTypes
    })
  ),
  className: PropTypes.string
};

export default Tabs;
