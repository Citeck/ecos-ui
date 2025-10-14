import classNames from 'classnames';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import React, { useState, useEffect } from 'react';

import { Tooltip } from '../../common';
import TitlePageLoader from '../../common/TitlePageLoader';
import { Badge } from '../../common/form';
import { Labels } from '../constants';

import Records from '@/components/Records';
import { PREDICATE_AND, PREDICATE_EQ } from '@/components/Records/predicates/predicates';
import NumberFormatter from '@/components/common/grid/formatters/gql/NumberFormatter';
import JournalsConverter from '@/dto/journals';
import KanbanConverter from '@/dto/kanban';
import { getWorkspaceId } from '@/helpers/urls';
import { extractLabel, t } from '@/helpers/util';
import AttributesService from '@/services/AttributesService';

interface HeaderColumnProps {
  data: { id: string; name: string; hasSum: boolean; sumAtt: string };
  totalCount: number;
  isReady: boolean;
  isViewNewJournal: boolean;
  predicate: any;
  searchPredicate: any;
  typeRef: string;
}

const HeaderColumn = ({ data, totalCount, isReady, typeRef, isViewNewJournal, predicate, searchPredicate }: HeaderColumnProps) => {
  const [columnSum, setColumnSum] = useState<number | undefined>();
  const [columnSumLabel, setColumnSumLabel] = useState<{ en: string; ru: string } | undefined>();

  useEffect(() => {
    const toConvertPredicates = isArray(predicate) ? predicate : [predicate];
    const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(data);

    if (!isEmpty(searchPredicate) && isObject(searchPredicate)) {
      toConvertPredicates.push(searchPredicate);
    }

    if (!isEmpty(statusModifiedPredicate) && isObject(statusModifiedPredicate)) {
      toConvertPredicates.push(statusModifiedPredicate);
    }

    if (isViewNewJournal && data.hasSum) {
      const journalId = AttributesService.parseId(typeRef);
      Records.queryOne(
        {
          sourceId: `emodel/${journalId}`,
          query: {
            t: PREDICATE_AND,
            v: [
              {
                t: PREDICATE_EQ,
                a: '_status',
                v: data.id
              },
              ...JournalsConverter.cleanUpPredicate(toConvertPredicates)
            ].filter(Boolean)
          },
          language: 'predicate',
          workspaces: [`${getWorkspaceId()}`],
          groupBy: ['*']
        },
        { value: `sum(${data.sumAtt})?num` }
      ).then(({ value }: { value: number }) => {
        setColumnSum(value || 0);
        updateColumnSumLabel();
      });
    }
  }, [totalCount]);

  useEffect(() => {
    updateColumnSumLabel();
  }, []);

  const updateColumnSumLabel = () => {
    if (isViewNewJournal && data.hasSum) {
      Records.get(typeRef)
        .load(`attributeById.${data.sumAtt}.name{ru,en}`)
        .then((label: { en: string; ru: string }) => {
          setColumnSumLabel(label || { en: '', ru: '' });
        });
    }
  };

  if (isEmpty(data)) {
    return null;
  }

  const targetCap = `head-caption_${data.id}`;
  const targetSumCap = `head-caption_${data.id}_${data.sumAtt}`;

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
          <Badge className="ecos-kanban__column-head-badge" text={`${totalCount}`} state={'primary'} withPopup />
        </TitlePageLoader>
      </div>
      {isViewNewJournal && data.hasSum && (
        <Tooltip target={targetSumCap} text={`${t(Labels.Kanban.COLUMNS_SUM_BY)} "${extractLabel(columnSumLabel)}"`} uncontrolled>
          <div className="ecos-kanban__column-sum" id={targetSumCap}>
            <div className="ecos-kanban__column-sum-value">
              <p>{NumberFormatter.formatNumber(columnSum)}</p>
            </div>
            <div className="ecos-kanban__column-sum-help">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.21289 6.86865V6.54346C5.21289 6.34424 5.24072 6.16846 5.29639 6.01611C5.35205 5.86084 5.44141 5.71436 5.56445 5.57666C5.6875 5.43604 5.8501 5.29248 6.05225 5.146C6.23389 5.01709 6.37891 4.90137 6.4873 4.79883C6.59863 4.69629 6.6792 4.59521 6.729 4.49561C6.78174 4.39307 6.80811 4.27734 6.80811 4.14844C6.80811 3.95801 6.73779 3.81299 6.59717 3.71338C6.45654 3.61377 6.26025 3.56396 6.0083 3.56396C5.75635 3.56396 5.50586 3.60352 5.25684 3.68262C5.01074 3.76172 4.76025 3.86572 4.50537 3.99463L4.02637 3.03223C4.31934 2.86816 4.63721 2.73633 4.97998 2.63672C5.32275 2.53418 5.69775 2.48291 6.10498 2.48291C6.73193 2.48291 7.2168 2.63379 7.55957 2.93555C7.90527 3.23438 8.07812 3.61523 8.07812 4.07812C8.07812 4.32422 8.03857 4.53809 7.95947 4.71973C7.8833 4.89844 7.76611 5.06543 7.60791 5.2207C7.45264 5.37305 7.25781 5.53418 7.02344 5.7041C6.84766 5.83301 6.71289 5.94141 6.61914 6.0293C6.52539 6.11719 6.46094 6.20508 6.42578 6.29297C6.39355 6.37793 6.37744 6.48193 6.37744 6.60498V6.86865H5.21289ZM5.07227 8.37158C5.07227 8.09619 5.14697 7.90283 5.29639 7.7915C5.44873 7.68018 5.63184 7.62451 5.8457 7.62451C6.05371 7.62451 6.23242 7.68018 6.38184 7.7915C6.53418 7.90283 6.61035 8.09619 6.61035 8.37158C6.61035 8.63525 6.53418 8.82568 6.38184 8.94287C6.23242 9.06006 6.05371 9.11865 5.8457 9.11865C5.63184 9.11865 5.44873 9.06006 5.29639 8.94287C5.14697 8.82568 5.07227 8.63525 5.07227 8.37158Z"
                  fill="#B7B7B7"
                />
                <circle cx="6" cy="6" r="5.5" stroke="#B7B7B7" />
              </svg>
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default HeaderColumn;
