import React from 'react';
import cn from 'classnames';
import Category from '../Category';
import Models from '../Models';

const Categories = ({ items, isParentHasNotModels }) => {
  if (!items) {
    return null;
  }

  const categoryList = items.map((item, idx) => {
    const keyId = item.id || idx;

    return (
      <Category key={keyId} itemId={item.id} label={item.label} level={item.level} isEditable={item.isEditable}>
        <Models items={item.models} />
        <Categories items={item.categories} isParentHasNotModels={!item.models} />
      </Category>
    );
  });

  return (
    <div
      className={cn({
        isParentHasNotModels
      })}
    >
      {categoryList}
    </div>
  );
};

export default Categories;
