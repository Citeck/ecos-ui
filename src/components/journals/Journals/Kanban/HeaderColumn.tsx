import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

import { Tooltip } from '@/components/common';
import TitlePageLoader from '@/components/common/TitlePageLoader';
import { Badge } from '@/components/common/form';
import { Labels } from '@/components/journals/Journals/constants';

import ColumnSum, { ColumnSumData } from './ColumnSum';

import { extractLabel, t } from '@/helpers/util';

interface HeaderColumnProps {
  data: ColumnSumData & { name: string };
  totalCount: number;
  isReady: boolean;
  predicate: any;
  searchPredicate: any;
  typeRef: string;
  /** Grouped mode hides the header sum — each swimlane cell renders its own. */
  showSum?: boolean;
}

const HeaderColumn = ({ data, totalCount, isReady, typeRef, predicate, searchPredicate, showSum = true }: HeaderColumnProps) => {
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
          typeRef={typeRef}
          predicate={predicate}
          searchPredicate={searchPredicate}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

export default HeaderColumn;
