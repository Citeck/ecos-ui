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

    let text;

    if (typeof cell === 'boolean') {
      text = cell ? t('boolean.yes') : t('boolean.no');
    } else {
      text = cell.disp || cell;
    }

    return text;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }
}
