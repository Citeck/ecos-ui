import React from 'react';

import { IcoBtn } from '../common/btns';
import { Tooltip } from '../common';

const Tools = ({ configButtons }) => (
  <div className="ecos-model-editor__designer-buttons">
    {configButtons.map(item => {
      return (
        item.action && (
          <div key={item.id}>
            <IcoBtn icon={item.icon} onClick={item.action} className={item.className} id={item.id} />
            <Tooltip trigger={item.trigger} target={item.id} text={item.text} />
          </div>
        )
      );
    })}
  </div>
);

export default Tools;
