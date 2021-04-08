import React from 'react';

import BaseFormatter from '../BaseFormatter';

/**
 * @typedef {FormatterProps} HtmlFormatterProps
 * @field {String} config.html - html content
 */

export default class HtmlFormatter extends BaseFormatter {
  static TYPE = 'html';

  /**
   * @param {HtmlFormatterProps} props
   * @return {React.ReactNode}
   */
  format(props) {
    const { config } = props;
    if (!config.html) {
      throw new Error(`"html" is a mandatory parameter in the HtmlFormatter config. Current config: ${JSON.stringify(config)}`);
    }

    return <div dangerouslySetInnerHTML={{ __html: config.html }} />;
  }
}
