import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import { selectCategoriesByParentId } from '../../../selectors/bpmn';
import Category from '../Category';
import Models from '../Models';

const mapStateToProps = (state, props) => {
  return {
    items: selectCategoriesByParentId(state, props),
    isParentHasNotModels: -1 === state.bpmn.models.findIndex(item => item.categoryId === props.parentId) // TODO use reselect
  };
};

const Categories = ({ items, isParentHasNotModels, level = 0 }) => {
  if (!items) {
    return null;
  }

  const categoryList = items.map((item, idx) => {
    const keyId = item.id || idx;

    return (
      <Category key={keyId} itemId={item.id} label={item.label} level={level} isEditable={item.isEditable}>
        <Models categoryId={item.id} />
        <ConnectedCategories parentId={item.id} level={level + 1} />
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
