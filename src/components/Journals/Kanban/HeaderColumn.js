import React from 'react';

import { Tooltip } from '../../common';
import { Badge } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { extractLabel, t } from '../../../helpers/util';
import { Labels } from '../constants';

function HeaderColumn({ data, totalCount, isReady }) {
  return (
    <div className="ecos-kanban__column" key={`head_${data.id}`}>
      <div className="ecos-kanban__column-head">
        <TitlePageLoader isReady={isReady} withBadge>
          <Tooltip target={`head_${data.id}`} text={extractLabel(data.name)} uncontrolled>
            <div className="ecos-kanban__column-head-caption" id={`head_${data.id}`}>
              {extractLabel(data.name) || t(Labels.Kanban.CARD_NO_TITLE)}
            </div>
          </Tooltip>
          {!!totalCount && <Badge text={totalCount} light state={'primary'} />}
        </TitlePageLoader>
      </div>
    </div>
  );
}

export default HeaderColumn;
