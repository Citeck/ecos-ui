import React from 'react';

import { t } from '../../../../../../helpers/export/util';
import { getBool } from '../../../../../../helpers/util';
import BaseFormatter from '../BaseFormatter';

export default class BooleanFormatter extends BaseFormatter {
  static TYPE = 'bool';

  format(props) {
    const text = getBool(props.cell) ? t('boolean.yes') : t('boolean.no');

    return <>{text}</>;
  }

  getAliases() {
    return ['BooleanFormatter', 'boolean'];
  }
}
