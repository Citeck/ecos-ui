import React from 'react';

import { tableFields } from '../../../constants/documents';
import { t } from '../../../helpers/export/util';
import { Grid } from '../../common/grid';
import classNames from 'classnames';
import { objectCompare } from '../../../helpers/util';

export default React.memo(
  props => {
    const { dynamicTypes, selectedType, autoHide, isHoverLastRow, tableData, countFormatter, maxWidth, ...gridProps } = props;

    if (selectedType || !dynamicTypes.length) {
      return null;
    }

    const columns = tableFields.ALL.map(item => {
      const { name, label, ...other } = item;
      const extended = {};

      if (name === 'count') {
        extended.customFormatter = countFormatter;
      }

      return {
        dataField: name,
        text: t(label),
        ...other,
        ...extended
      };
    });

    return (
      <div className="ecos-docs__table-container" style={{ maxWidth }}>
        <Grid
          className={classNames('ecos-docs__table ecos-docs__table_types', {
            'ecos-docs__table_without-after-element': isHoverLastRow
          })}
          rowClassName="ecos-docs__table-row"
          data={tableData}
          columns={columns}
          scrollable
          fixedHeader
          scrollAutoHide={autoHide}
          autoHeight
          keyField="type"
          {...gridProps}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return objectCompare(prevProps, nextProps, { exclude: ['forwardedRef'] });
  }
);
