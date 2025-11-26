import PropTypes from 'prop-types';
import React from 'react';

import { Tooltip } from '../common';
import { IcoBtn } from '../common/btns';

import { ToolsInterface } from './propsInterfaces';

const Tools = ({ configButtons, className }) =>
  configButtons ? (
    <div className={className}>
      {configButtons.map(
        item =>
          item.action && (
            <div key={item.id}>
              <Tooltip contentComponent={item.contentComponent} text={item.text} target={item.id} trigger={item.trigger}>
                <IcoBtn id={item.id} icon={item.icon} onClick={item.action} className={item.className} />
              </Tooltip>
            </div>
          )
      )}
    </div>
  ) : null;

Tools.propTypes = {
  configButtons: PropTypes.arrayOf(PropTypes.shape(ToolsInterface))
};

export default Tools;
