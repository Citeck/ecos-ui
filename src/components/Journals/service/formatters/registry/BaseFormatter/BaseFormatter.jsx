import React from 'react';

import Popper from '../../../../../common/Popper';

import './BaseFormatter.scss';

export default class BaseFormatter {
  static TYPE = '';

  /**
   * @param {FormatterProps} props
   * @field {Object}   config
   * @field {Object}   config._extra          - extra arguments, injected by FormatterService
   * @field {function} config._extra.format   - alias for FormatterService.format
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
