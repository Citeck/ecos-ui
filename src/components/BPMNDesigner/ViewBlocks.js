import React from 'react';
import { connect } from 'react-redux';

import { ROOT_CATEGORY_NODE_REF } from '../../constants/bpmn';
import { t } from '../../helpers/export/util';
import { createCategory } from '../../actions/bpmn';
import Categories from './Categories/Categories';

const ViewBlocks = ({ createCategory, hidden }) => {
  return (
    <div className={hidden ? 'd-none' : ''}>
      <Categories categoryId={ROOT_CATEGORY_NODE_REF} />
      <div className="bpmn-designer-page__add-category" onClick={createCategory}>
        {t('bpmn-designer.add-category')}
      </div>
    </div>
  );
};

const mapDispatchToProps = dispatch => ({
  createCategory: () => dispatch(createCategory({ parentId: ROOT_CATEGORY_NODE_REF }))
});

export default connect(
  null,
  mapDispatchToProps
)(ViewBlocks);
