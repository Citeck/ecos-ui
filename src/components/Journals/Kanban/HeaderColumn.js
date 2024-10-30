import React from 'react';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

import { Tooltip } from '../../common';
import { Badge } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { extractLabel, t } from '../../../helpers/util';
import { Labels } from '../constants';

function HeaderColumn({ data, totalCount, isReady, isViewNewJournal }) {
  if (isEmpty(data)) {
    return null;
  }

  const targetCap = `head-caption_${data.id}`;
  const badge = String(totalCount);

  return (
    <div className={classNames('ecos-kanban__column', { 'ecos-kanban__column-name': isViewNewJournal })}>
      <div className="ecos-kanban__column-head">
        <TitlePageLoader isReady={isReady} withBadge>
          <Tooltip target={targetCap} text={extractLabel(data.name)} uncontrolled showAsNeeded>
            <div className="ecos-kanban__column-head-caption" id={targetCap}>
              {extractLabel(data.name) || t(Labels.Kanban.CARD_NO_TITLE)}
            </div>
          </Tooltip>
          <Badge className="ecos-kanban__column-head-badge" text={badge} light state={'primary'} withPopup />
        </TitlePageLoader>
      </div>
    </div>
  );
}

export default HeaderColumn;
