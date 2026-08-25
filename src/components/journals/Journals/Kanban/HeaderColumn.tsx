import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

import { Tooltip } from '@/components/common';
import TitlePageLoader from '@/components/common/TitlePageLoader';
import { Badge } from '@/components/common/form';
import { Labels } from '@/components/journals/Journals/constants';

import ColumnSum, { ColumnSumData } from './ColumnSum';

import { KanbanRelatedFilter } from '@/types/store/kanban';

import { extractLabel, t } from '@/helpers/util';

interface HeaderColumnProps {
  data: ColumnSumData & { name: string };
  totalCount: number;
  isReady: boolean;
  /** Everything below is read by the sum only — a header with `showSum={false}` needs none of it. */
  predicate?: any;
  searchPredicate?: any;
  relatedFilter?: KanbanRelatedFilter;
  /** The card scope the server resolves server-side: record source, card type and journal predicate. */
  sourceId?: string;
  ecosType?: string;
  /** Full ref of that same card type — the tooltip label of the summed attribute is resolved on it. */
  sumTypeRef?: string;
  journalPredicate?: any;
  /** Grouped mode hides the header sum — each swimlane cell renders its own. */
  showSum?: boolean;
}

const HeaderColumn = ({
  data,
  totalCount,
  isReady,
  predicate,
  searchPredicate,
  relatedFilter,
  sourceId,
  ecosType,
  sumTypeRef,
  journalPredicate,
  showSum = true
}: HeaderColumnProps) => {
  if (isEmpty(data)) {
    return null;
  }

  const targetCap = `head-caption_${data.id}`;

  return (
    <div className={classNames('ecos-kanban__column ecos-kanban__column-name')}>
      <div className="ecos-kanban__column-head">
        <TitlePageLoader isReady={isReady} withBadge>
          <Tooltip target={targetCap} text={extractLabel(data.name)} uncontrolled showAsNeeded>
            <div className="ecos-kanban__column-head-caption" id={targetCap}>
              {extractLabel(data.name) || t(Labels.Kanban.CARD_NO_TITLE)}
            </div>
          </Tooltip>
          <Badge className="ecos-kanban__column-head-badge" text={`${totalCount}`} state={'primary'} withPopup />
        </TitlePageLoader>
      </div>
      {showSum && data.hasSum && (
        <ColumnSum
          data={data}
          targetId={`head-caption_${data.id}_${data.sumAtt}`}
          sumTypeRef={sumTypeRef}
          predicate={predicate}
          searchPredicate={searchPredicate}
          relatedFilter={relatedFilter}
          sourceId={sourceId}
          ecosType={ecosType}
          journalPredicate={journalPredicate}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

export default HeaderColumn;
