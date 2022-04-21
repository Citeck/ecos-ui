import React, { useCallback } from 'react';

import { IcoBtn } from '../../common/btns';

import './style.scss';
import PropTypes from 'prop-types';
import ModelViewer from '../ModelViewer';
import { Zooms } from '../util';

const Zoomer = ({ instModelRef }) => {
  const cn = 'ecos-btn_transparent ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-tree__action model-zoomer__btn';
  const handleZoom = useCallback(val => instModelRef && instModelRef.setZoom(val), [instModelRef]);

  return (
    <div className="model-zoomer">
      <IcoBtn icon="icon-backup" className={cn} onClick={() => handleZoom(Zooms.DEFAULT)} />
      <IcoBtn icon="icon-resize-full-alt" className={cn} onClick={() => handleZoom(Zooms.FIT)} />
      <IcoBtn icon="icon-zoom-out" className={cn} onClick={() => handleZoom(-1 * Zooms.STEP)} />
      <IcoBtn icon="icon-zoom-in" className={cn} onClick={() => handleZoom(Zooms.STEP)} />
    </div>
  );
};

Zoomer.propTypes = {
  instModelRef: PropTypes.instanceOf(ModelViewer)
};

export default Zoomer;
