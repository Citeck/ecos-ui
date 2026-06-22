import { Labels } from '@citeck/constants/bpmn';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { createCategory, initRequest, updateModels } from '@/actions/bpmn';
import { t } from '@/helpers/export/util';
import { Loader } from '@/components/common';

import Categories from './Categories/Categories';
import ControlPanel from './ControlPanel/ControlPanel';

import '@/components/editors/DesignerCommon/style.scss';

const mapStateToProps = state => ({
  isReady: state.bpmn.isReady,
  createVariants: state.bpmn.createVariants,
  isAdmin: state.user.isAdmin
});

const mapDispatchToProps = dispatch => ({
  updateModels: () => dispatch(updateModels({})),
  initSection: () => dispatch(initRequest({ parentId: '' })),
  createCategory: () => dispatch(createCategory({ parentId: '' }))
});

const BPMNDesigner = ({ createCategory, hidden, isReady, initSection, updateModels, isAdmin }) => {
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
          <div
            className={classNames('ecos-designer__content', {
              'ecos-designer__content-full': !isAdmin
            })}
          >
            <Categories categoryId={null} />
          </div>
          {isAdmin && (
            <div className="ecos-designer__add-category" onClick={createCategory}>
              {t(Labels.ADD_CATEGORY)}
            </div>
          )}
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

export default connect(mapStateToProps, mapDispatchToProps)(BPMNDesigner);
