import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';

import { selectCategoriesByParentId, selectIsParentHasNotModels } from '../../../selectors/bpmn';
import Category from '../Category';
import Models from '../Models';

const mapStateToProps = (state, props) => {
  return {
    items: selectCategoriesByParentId(state, props),
    isParentHasNotModels: selectIsParentHasNotModels(state, props)
  };
};

const Categories = ({ items, isParentHasNotModels, level = 0 }) => {
  if (!items) {
    return null;
  }

  const categoryList = items.map((item, idx) => {
    const keyId = item.id || idx;

    return (
      <Category
        key={keyId}
        itemId={item.id}
        label={item.label}
        level={level}
        isEditable={item.isEditable}
        canWrite={item.canWrite}
        isOpen={item.isOpen}
      >
        <Models categoryId={item.id} />
        <ConnectedCategories categoryId={item.id} level={level + 1} />
      </Category>
    );
  });

  return (
    <div
      className={cn({
        isParentHasNotModels: level !== 0 && isParentHasNotModels
      })}
    >
      {categoryList}
    </div>
  );
};

const ConnectedCategories = connect(mapStateToProps)(Categories);
export default ConnectedCategories;
