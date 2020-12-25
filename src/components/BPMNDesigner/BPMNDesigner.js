import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { Labels, ROOT_CATEGORY_NODE_REF } from '../../constants/bpmn';
import { t } from '../../helpers/export/util';
import { Loader } from '../common';
import { createCategory, initRequest } from '../../actions/bpmn';
import Categories from './Categories/Categories';
import ControlPanel from './ControlPanel/ControlPanel';

const mapStateToProps = state => ({
  isReady: state.bpmn.isReady
});

const mapDispatchToProps = dispatch => ({
  initSection: () => dispatch(initRequest({ parentId: ROOT_CATEGORY_NODE_REF })),
  createCategory: () => dispatch(createCategory({ parentId: ROOT_CATEGORY_NODE_REF }))
});

const BPMNDesigner = ({ createCategory, hidden, isReady, initSection }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!hidden && !initialized) {
      setInitialized(true);
      initSection();
    }
  }, [initialized, hidden]);

  return (
    <>
      {
        <div className={classNames('ecos-bpmn-designer', { 'd-none': hidden })}>
          <ControlPanel />
          {isReady && (
            <div className="ecos-bpmn-designer__content">
              <Categories categoryId={ROOT_CATEGORY_NODE_REF} />
              <div className="ecos-bpmn-designer__add-category" onClick={createCategory}>
                {t(Labels.ADD_CATEGORY)}
              </div>
            </div>
          )}
          {!isReady && (
            <div className="ecos-bpmn-designer-common__container_white ecos-bpmn-designer-common__loader">
              <Loader />
            </div>
          )}
        </div>
      }
    </>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BPMNDesigner);
