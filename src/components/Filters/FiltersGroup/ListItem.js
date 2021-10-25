import React from 'react';

const ListItem = ({ cssItemClasses, provided, item, children }) => {
  return (
    <li
      className={cssItemClasses}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style }}
    >
      {item || children}
    </li>
  );
};

export default ListItem;
