import Records from '@citeck/records-core';
import classNames from 'classnames';
import React, { useState, useEffect, useMemo } from 'react';

import { Tooltip } from '@/components/common';
import { Labels } from '@/components/journals/Journals/constants';

import NumberFormatter from '@/components/common/grid/formatters/gql/NumberFormatter';
import { buildColumnSumQuery } from '@/dto/kanban';
import { getWorkspaceId } from '@/helpers/urls';
import { extractLabel, t } from '@/helpers/util';
import { KanbanRelatedFilter } from '@/types/store/kanban';

export interface ColumnSumData {
  id: string;
  hasSum: boolean;
  sumAtt: string;
  additionalFilter?: any;
}

interface ColumnSumProps {
  data: ColumnSumData;
  targetId: string;
  predicate: any;
  searchPredicate: any;
  /** `journalConfig.sourceId` — the source the SERVER loads the cards from; also the "config has arrived" flag. */
  sourceId?: string;
  /** Local id of the card type — the source resolves type-specific attributes (the sum itself) through it. */
  ecosType?: string;
  /**
   * Full ref of that same CARD type (`Kanban.mapStateToProps`), which for a journal-backed board is
   * the JOURNAL's type — not necessarily `boardConfig.typeRef`. The tooltip label of the summed
   * attribute is resolved on it, so taking the board's own type here would look the attribute up on a
   * type that need not have it and leave the tooltip reading `Sum by ""`.
   */
  sumTypeRef?: string;
  /** `journalConfig.predicate` — the journal's own scope, added by the server to every card request. */
  journalPredicate?: any;
  /** Scopes the sum to one swimlane cell (grouped mode); the whole column is summed without it. */
  groupPredicate?: any;
  /** The board's "only linked records" predicate — the sum must honour it like the cards do. */
  relatedFilter?: KanbanRelatedFilter;
  totalCount?: number | string;
  className?: string;
}

const ColumnSum = ({
  data,
  targetId,
  sourceId,
  ecosType,
  sumTypeRef,
  journalPredicate,
  predicate,
  searchPredicate,
  groupPredicate,
  relatedFilter,
  totalCount,
  className
}: ColumnSumProps) => {
  const [columnSum, setColumnSum] = useState<number | undefined>();
  const [columnSumLabel, setColumnSumLabel] = useState<{ en: string; ru: string } | undefined>();

  // No `sourceId` means the board is journal-backed and its config has not arrived yet: querying now
  // would sum the whole type, and that wrong value would be on screen until the config lands. A board
  // WITHOUT a journal never gets here — `mapStateToProps` resolves its source from the board type, so
  // this gate cannot leave such a board with a permanently blank banner.
  //
  // Memoized because building the query clones every predicate and serializing it walks the whole
  // tree (`relatedFilter` can carry a long list of refs) — and a board re-renders every cell on every
  // frame of a drag. The parents are expected to keep these props reference-stable for it to pay off:
  // `Swimlane` memoizes `groupPredicate` and `Kanban` caches `searchPredicate`, both pinned by tests.
  const queryParams = useMemo(
    () =>
      data.hasSum && !!sourceId
        ? buildColumnSumQuery({
            column: data,
            sourceId,
            ecosType,
            journalPredicate,
            predicate,
            searchPredicate,
            groupPredicate,
            relatedFilter,
            workspaceId: getWorkspaceId()
          })
        : null,
    [data, sourceId, ecosType, journalPredicate, predicate, searchPredicate, groupPredicate, relatedFilter]
  );
  const sumAttribute = `sum(${data.sumAtt})?num`;
  // The effect keys off this STRING, never off `queryParams` itself: the parents rebuild the
  // predicates on every render, so a reference dep would re-fire the request forever. A rebuilt but
  // value-equal query therefore serializes to the same key and changes nothing.
  const queryKey = useMemo(() => (queryParams ? JSON.stringify([queryParams, sumAttribute]) : ''), [queryParams, sumAttribute]);

  useEffect(() => {
    if (!queryParams) {
      return;
    }

    // A newer request may resolve first — a late answer must never overwrite the current one.
    let cancelled = false;

    Records.queryOne(queryParams, { value: sumAttribute })
      .then(({ value }: { value: number }) => {
        if (!cancelled) {
          setColumnSum(value || 0);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          // Keeping the previous number would show a sum belonging to another selection.
          console.warn('[Kanban/ColumnSum] failed to load the column sum', e);
          setColumnSum(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
    // `queryKey` is the serialized `queryParams`; `totalCount` is a cheap "the cell changed" trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, totalCount]);

  // Same "not ready" gate as the sum: the card type of a journal-backed board arrives with the
  // journal config, and `Records.get(undefined)` is not a record. The effect re-runs once it lands.
  useEffect(() => {
    if (!data.hasSum || !sumTypeRef) {
      return;
    }

    let cancelled = false;

    Records.get(sumTypeRef)
      .load(`attributeById.${data.sumAtt}.name{ru,en}`)
      .then((label: { en: string; ru: string }) => {
        if (!cancelled) {
          setColumnSumLabel(label || { en: '', ru: '' });
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          // The number itself is still valid — only the tooltip stays without an attribute name.
          console.warn('[Kanban/ColumnSum] failed to load the label of the summed attribute', e);
          setColumnSumLabel(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumTypeRef, data.sumAtt, data.hasSum]);

  if (!data.hasSum) {
    return null;
  }

  return (
    <Tooltip target={targetId} text={`${t(Labels.Kanban.COLUMNS_SUM_BY)} "${extractLabel(columnSumLabel)}"`} uncontrolled>
      <div className={classNames('ecos-kanban__column-sum', className)} id={targetId}>
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
  );
};

export default ColumnSum;
