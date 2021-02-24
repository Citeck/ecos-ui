import BaseFormatter from '../BaseFormatter';
import CellType from '../../CellType';

export default class DefaultFormatter extends BaseFormatter {
  static TYPE = 'default';

  format(props) {
    const { cell } = props;
    if (!cell) {
      return '';
    }
    return cell.disp || cell;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }
}
