import React, { useEffect, useState, useMemo } from 'react';
import get from 'lodash/get';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';

import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';

import './JournalsGrouping.scss';

const JournalsGrouping = ({ grouping, allowedColumns = [], onChange, metaRecord }) => {
  const allowedList = useMemo(() => allowedColumns.filter(c => c.default && c.groupable), [allowedColumns]);
  const [groupingColumns, setGrouping] = useState({ aggregations: [], groupingList: [] });

  useEffect(
    () => {
      const aggregationList = [],
        list = [];

      forEach(get(grouping, 'columns'), groupingColumn => {
        const match = allowedList.filter(column => column.attribute === groupingColumn.attribute)[0];

        match ? list.push(groupingColumn) : aggregationList.push(groupingColumn);
      });

      setGrouping({ aggregations: aggregationList, groupingList: list });
    },
    [grouping, metaRecord]
  );

  if (isEmpty(allowedList)) {
    return null;
  }

  return (
    <PanelBar
      header={t('journals.grouping.header')}
      className={'journals-grouping__panel-bar'}
      css={{ headerClassName: 'panel-bar__header_upper' }}
      open={false}
    >
      <Grouping
        metaRecord={metaRecord}
        className={'journals-grouping'}
        groupBy={get(grouping, 'groupBy')}
        list={allowedList}
        allowedColumns={allowedColumns}
        grouping={groupingColumns.groupingList}
        needCount={get(grouping, 'needCount')}
        aggregation={groupingColumns.aggregations}
        valueField={'attribute'}
        titleField={'text'}
        showAggregation={get(grouping, 'groupBy.length')}
        onGrouping={onChange}
      />
    </PanelBar>
  );
};

export default JournalsGrouping;
