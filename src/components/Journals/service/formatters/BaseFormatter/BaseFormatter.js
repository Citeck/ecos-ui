import CellType from '../CellType';

import './BaseFormatter.scss';

/**
 * Formatter should be stateless for performance reasons.
 */
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
}

export default BaseFormatter;
