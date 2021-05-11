import React from 'react';

import CellType from '../../CellType';
import Popper from '../../../../../common/Popper';

import './BaseFormatter.scss';

class BaseFormatter {
  static TYPE = '';

  /**
   * @param {FormatterProps} props
   * @field {Object}   config
   * @field {function} format   - alias for FormatterService.format
   * @return {React.ReactNode}
   */
  format(props) {
    return null;
  }

  /**
   * @return {String}
   */
  getType() {
    return this.constructor.TYPE || BaseFormatter.TYPE;
  }

  getAliases() {
    return [];
  }

  getSupportedCellType() {
    return CellType.SCALAR;
  }

  PopperWrapper = React.memo(props => {
    return (
      <Popper
        showAsNeeded
        text={props.text}
        icon="icon-question"
        popupClassName="formatter-popper"
        contentComponent={props.contentComponent}
      >
        {props.children}
      </Popper>
    );
  });
}

export default BaseFormatter;
