import React from 'react';

import BaseFormatter from '../../BaseFormatter';

/**
 * @field {String} config.html - html content
 */

export default class ComponentFormatter extends BaseFormatter {
  static TYPE = 'component';

  /**
   * @return {React.ReactNode}
   */
  format(props) {
    const { row = {}, config } = props;

    const Component = config.Component;
    if (!Component) {
      throw new Error(`"Component" is a mandatory parameter in the ComponentFormatter config. Current config: ${JSON.stringify(config)}`);
    }

    return <Component row={row} />;
  }
}
