import BaseFormatter from '../BaseFormatter';
import CellType from '../../CellType';
import { t } from '../../../../../../helpers/export/util';

export default class DefaultFormatter extends BaseFormatter {
  static TYPE = 'default';

  format(props) {
    const { cell } = props;
    if (cell == null) {
      return '';
    }
    if (typeof cell === 'boolean') {
      return cell ? t('boolean.yes') : t('boolean.no');
    }
    return cell.disp || cell;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }
}
