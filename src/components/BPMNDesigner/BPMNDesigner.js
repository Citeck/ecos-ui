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
  isMobile: state.view.isMobile,
  isReady: state.bpmn.isReady
});

const mapDispatchToProps = dispatch => ({
  initRequest: () => dispatch(initRequest({ parentId: ROOT_CATEGORY_NODE_REF })),
  createCategory: () => dispatch(createCategory({ parentId: ROOT_CATEGORY_NODE_REF }))
});

const BPMNDesigner = ({ createCategory, hidden, isReady, initRequest }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!hidden && !initialized) {
      setInitialized(true);
      initRequest();
    }
  }, [initialized]);

  return (
    <>
      {
        <div className={classNames('bpmn-designer-view-models', { 'd-none': hidden })}>
          <ControlPanel />
          {isReady && (
            <>
              <Categories categoryId={ROOT_CATEGORY_NODE_REF} />
              <div className="bpmn-designer-view-models__add-category" onClick={createCategory}>
                {t(Labels.ADD_CATEGORY)}
              </div>
            </>
          )}
          {!isReady && (
            <div className="bpmn-common-container_white bpmn-common-loader">
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
