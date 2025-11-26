import React from 'react';

import { t } from '../../helpers/util';
import { Btn } from '../common/btns';
import { DocPreview } from '../widgets/DocPreview';
import { Labels } from './constants';

export const FlowableProcess = ({ recordId, disabledCancelBP, handleCancelBP }) => {
  return (
    <div className="ecos-business-process">
      <div className="ecos-business-process__content">
        <DocPreview height={'100%'} scale={1} recordId={recordId} noIndents />
      </div>
      <div className="ecos-business-process__actions">
        <Btn onClick={handleCancelBP} disabled={disabledCancelBP}>
          {t(Labels.BTN_CANCEL_BP)}
        </Btn>
      </div>
    </div>
  );
};
