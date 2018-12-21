import React from 'react';
import Category from '../Category';
import Models from '../Models';
import cn from 'classnames';

const Categories = ({ items, isParentHasNotModels }) => {
  if (!items) {
    return null;
  }

  const categoryList = items.map((item, idx) => {
    const itemId = item.id || idx;

    const actions = [
      {
        label: 'Переименовать',
        onClick: () => {
          console.log('rename');
        }
      },
      {
        label: 'Доступ',
        onClick: () => {
          console.log('access');
        }
      },
      {
        label: 'Удалить',
        onClick: () => {
          console.log('delete');
        }
      }
    ];

    if (item.level < 2) {
      actions.unshift({
        label: 'Добавить подкатегорию',
        onClick: () => {
          console.log('add subcategory');
        }
      });
    }

    return (
      <Category key={itemId} label={item.label} level={item.level} isEditable={item.isEditable} actions={actions}>
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
