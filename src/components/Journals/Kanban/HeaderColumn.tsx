import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import React, { useState, useEffect } from 'react';

import { extractLabel, t } from '../../../helpers/util';
import { Tooltip } from '../../common';
import TitlePageLoader from '../../common/TitlePageLoader';
import { Badge } from '../../common/form';
import { Labels } from '../constants';

// @ts-ignore
import Records from '@/components/Records';
import NumberFormatter from '@/components/common/grid/formatters/gql/NumberFormatter';
import AttributesService from '@/services/AttributesService';

interface HeaderColumnProps {
  data: { id: string; name: string; hasSum: boolean; sumAtt: string };
  totalCount: boolean;
  isReady: boolean;
  isViewNewJournal: boolean;
  typeRef: string;
}

const HeaderColumn = ({ data, totalCount, isReady, typeRef, isViewNewJournal }: HeaderColumnProps) => {
  const [columnSum, setColumnSum] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (data.hasSum) {
      const journalId = AttributesService.parseId(typeRef);
      // @ts-ignore
      Records.queryOne(
        {
          sourceId: `emodel/${journalId}`,
          query: {
            t: 'and',
            v: [
              {
                t: 'eq',
                a: '_status',
                v: data.id
              }
            ]
          },
          language: 'predicate',
          groupBy: ['*']
        },
        `sum(${data.sumAtt})?num`
      ).then((resultSum: React.SetStateAction<number | undefined>) => {
        setColumnSum(resultSum || 0);
      });
    }
  }, [data.hasSum, data.sumAtt]);

  if (isEmpty(data)) {
    return null;
  }

  const targetCap = `head-caption_${data.id}`;

  return (
    <div
      className={classNames('ecos-kanban__column', {
        'ecos-kanban__column-name': isViewNewJournal
      })}
    >
      <div className="ecos-kanban__column-head">
        <TitlePageLoader isReady={isReady} withBadge>
          <Tooltip target={targetCap} text={extractLabel(data.name)} uncontrolled showAsNeeded>
            <div className="ecos-kanban__column-head-caption" id={targetCap}>
              {extractLabel(data.name) || t(Labels.Kanban.CARD_NO_TITLE)}
            </div>
          </Tooltip>
          <Badge className="ecos-kanban__column-head-badge" text={`${totalCount}`} light state={'primary'} withPopup />
        </TitlePageLoader>
      </div>
      {data.hasSum && (
        <div className="ecos-kanban__column-sum">
          <div className="ecos-kanban__column-sum-label">{t(Labels.Kanban.COLUMNS_SUM)}</div>
          <div className="ecos-kanban__column-sum-value">{NumberFormatter.formatNumber(columnSum)}</div>
        </div>
      )}
    </div>
  );
};

export default HeaderColumn;
