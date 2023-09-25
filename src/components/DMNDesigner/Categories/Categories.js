import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';

import { selectAllCategoriesByParentId, selectIsParentHasNotModels } from '../../../selectors/dmn';
import Category from '../Category';
import Models from '../Models';

const mapStateToProps = (state, props) => {
  return {
    categories: selectAllCategoriesByParentId(state, props),
    isParentHasNotModels: selectIsParentHasNotModels(state, props)
  };
};

const Categories = ({ categories, isParentHasNotModels, level = 0 }) => {
  return (
    <div className={cn({ isParentHasNotModels: level !== 0 && isParentHasNotModels })}>
      {categories.map(category => (
        <Category
          key={category.id}
          categoryId={category.id}
          label={category.label}
          level={level}
          isEditable={category.isEditable}
          canWrite={category.canWrite}
          isOpen={category.isOpen}
        >
          <Models categoryId={category.id} />
          <ConnectedCategories categoryId={category.id} level={level + 1} />
        </Category>
      ))}
    </div>
  );
};

const ConnectedCategories = connect(mapStateToProps)(Categories);
export default ConnectedCategories;