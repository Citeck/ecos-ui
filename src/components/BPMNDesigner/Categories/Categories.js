import React from 'react';
import Category from '../Category';
import Models from '../Models';
import cn from 'classnames';

const Categories = ({ items, isParentHasNotModels }) => {
  if (!items) {
    return null;
  }

  const categoryList = items.map(item => {
    return (
      <Category label={item.label} level={item.level} isEditable={item.isEditable}>
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
