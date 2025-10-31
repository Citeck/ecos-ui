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
          {...category}
          key={category.id}
          categoryId={category.id}
          label={category.label}
          sectionCode={category.sectionCode}
          level={level}
          isEditable={category.isEditable}
          canWrite={category.canWrite}
          isOpen={category.isOpen}
        >
          <Models categoryId={category.id} canEditDef={category.canEditDef} canCreateDef={category.canCreateDef} />
          <ConnectedCategories categoryId={category.id} level={level + 1} />
        </Category>
      ))}
    </div>
  );
};

const ConnectedCategories = connect(mapStateToProps)(Categories);
export default ConnectedCategories;
