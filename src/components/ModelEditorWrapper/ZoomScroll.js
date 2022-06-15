import React from 'react';
// import PropTypes from 'prop-types';

import { IcoBtn } from '../common/btns';
import { Tooltip } from '../common';
// import { ToolsInterface } from './propsInterfaces';

const ZoomScroll = ({ onZoomIn }) => (
  <div className="ecos-model-editor__designer-zoom">
    <IcoBtn icon="icon-backup" />
    <IcoBtn onClick={onZoomIn} icon="icon-zoom-in" />
    <IcoBtn icon="icon-zoom-out" />

    {/* {configButtons.map(item => {
      return (
        item.action && (
          <div key={item.id}>
            <IcoBtn icon={item.icon} onClick={item.action} className={item.className} id={item.id} />
            <Tooltip trigger={item.trigger} target={item.id} text={item.text} />
          </div>
        )
      );
    })} */}
  </div>
);

// Tools.propTypes = {
//   configButtons: PropTypes.arrayOf(PropTypes.shape(ToolsInterface))
// };

export default ZoomScroll;
