import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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

Tab.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  isActive: PropTypes.bool,
  hasHover: PropTypes.bool,
  onClick: PropTypes.func
};

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

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      ...Tab.propTypes
    })
  ),
  className: PropTypes.string,
  hasHover: PropTypes.bool
};

Tabs.defaultProps = {
  items: [],
  className: '',
  hasHover: false
};

export default Tabs;
