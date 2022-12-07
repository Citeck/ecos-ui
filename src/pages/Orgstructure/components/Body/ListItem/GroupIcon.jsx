import React from 'react';

const GroupIcon = ({ title, className, onClick }) => {
  return (
    <span title={title} className="orgstructure-page__list-item-icons-group">
      <i className={className} onClick={onClick} />
    </span>
  );
};

export default GroupIcon;
