import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';

import { isMobileDevice, t } from '../../../helpers/util';
import { Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import ModelViewer from '../ModelViewer';
import { Labels, Zooms } from '../util';

import './style.scss';

const buttons = [
  {
    icon: 'icon-backup',
    zoom: Zooms.DEFAULT,
    tip: t(Labels.ZOOM_RESET)
  },
  {
    icon: 'icon-resize-full-alt',
    zoom: Zooms.FIT,
    tip: t(Labels.ZOOM_WINDOW)
  },
  {
    icon: 'icon-zoom-out',
    zoom: -1 * Zooms.STEP,
    tip: t(Labels.ZOOM_OUT)
  },
  {
    icon: 'icon-zoom-in',
    zoom: Zooms.STEP,
    tip: t(Labels.ZOOM_IN)
  }
].map(btn => ({ ...btn, key: uniqueId('model-zoom-btn-') }));

const Zoomer = ({ instModelRef }) => {
  const cn = 'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue model-zoomer__btn';
  const handleZoom = useCallback(val => instModelRef && instModelRef.setZoom(val), [instModelRef]);

  return (
    <div className="model-zoomer">
      {buttons.map(item => (
        <Tooltip key={item.key} off={isMobileDevice()} target={item.key} text={item.tip} uncontrolled>
          <IcoBtn id={item.key} icon={item.icon} className={cn} onClick={() => handleZoom(item.zoom)} />
        </Tooltip>
      ))}
    </div>
  );
};

Zoomer.propTypes = {
  instModelRef: PropTypes.instanceOf(ModelViewer)
};

export default Zoomer;
