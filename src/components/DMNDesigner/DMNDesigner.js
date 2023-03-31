import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { Labels } from '../../constants/bpmn';
import { t } from '../../helpers/export/util';
import { initRequest, createCategory, updateModels } from '../../actions/dmn';
import { Loader } from '../common';
import Categories from './Categories';
import ControlPanel from './ControlPanel/ControlPanel';

import '../designerCommon/style.scss';

const mapStateToProps = state => ({
  isReady: state.dmn.isReady
});

const mapDispatchToProps = dispatch => ({
  updateModels: () => dispatch(updateModels()),
  initSection: () => dispatch(initRequest()),
  createCategory: () => dispatch(createCategory({ parentId: '' }))
});

const DMNDesigner = ({ hidden, isReady, initSection, createCategory }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!hidden && !initialized) {
      setInitialized(true);
      initSection();
    } else if (!hidden) {
      updateModels();
    }
  }, [initialized, hidden]);

  return (
    <div className={classNames('ecos-designer', { 'd-none': hidden })}>
      {isReady && (
        <>
          <ControlPanel />
          <div className="ecos-designer__content">
            <Categories />
          </div>
          <div className="ecos-designer__add-category" onClick={createCategory}>
            {t(Labels.ADD_CATEGORY)}
          </div>
        </>
      )}
      {!isReady && (
        <div className="ecos-designer-common__container_white ecos-designer-common__loader">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DMNDesigner);
