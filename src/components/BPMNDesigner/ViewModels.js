import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { Labels, ROOT_CATEGORY_NODE_REF } from '../../constants/bpmn';
import { t } from '../../helpers/export/util';
import { createCategory } from '../../actions/bpmn';
import Categories from './Categories/Categories';
import ControlPanel from './ControlPanel/ControlPanel';

const ViewModels = ({ createCategory, hidden }) => {
  return (
    <div className={classNames('bpmn-designer-view-models', { 'd-none': hidden })}>
      <ControlPanel />
      <Categories categoryId={ROOT_CATEGORY_NODE_REF} />
      <div className="bpmn-designer-view-models__add-category" onClick={createCategory}>
        {t(Labels.ADD_CATEGORY)}
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
)(ViewModels);
