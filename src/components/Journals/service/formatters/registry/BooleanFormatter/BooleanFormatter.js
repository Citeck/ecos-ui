import React, { Fragment } from 'react';

import BaseFormatter from '../BaseFormatter';
import { t } from '../../../../../../helpers/export/util';

export default class BooleanFormatter extends BaseFormatter {
  static TYPE = 'bool';

  format(props) {
    let cell = props.cell;
    cell = cell === true || cell === 'true' ? t('boolean.yes') : t('boolean.no');
    return <Fragment>{cell}</Fragment>;
  }

  getAliases() {
    return ['BooleanFormatter', 'boolean'];
  }
}
