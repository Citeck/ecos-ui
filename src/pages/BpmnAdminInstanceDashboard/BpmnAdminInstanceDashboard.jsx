import React, { useContext } from 'react';

import { IcoBtn } from '../../components/common/btns';
import { t } from '../../helpers/util';
import { INSTANCE_ADMIN_BLOCK_CLASS } from './constants';
import { InstanceContext } from './InstanceContext';
import { selectInstanceMetaInfo } from '../../selectors/instanceAdmin';
import labels from './Labels';

import './style.scss';

const BpmnSchema = React.lazy(() => import('../../components/BpmnSchema'));
const JournalsTabs = React.lazy(() => import('./JournalsTabs'));
const MetaInfo = React.lazy(() => import('./MetaInfo'));

const BpmnAdminInstanceDashboard = () => {
  const { dispInstanceId, isSuspended, instanceId, activityElement } = useContext(InstanceContext);

  const selectMetaInfo = (store, props) => {
    return selectInstanceMetaInfo(store, { ...props, instanceId });
  };

  return (
    <div className={INSTANCE_ADMIN_BLOCK_CLASS}>
      <div className={`${INSTANCE_ADMIN_BLOCK_CLASS}__title-wrapper`}>
        <h5 className={`${INSTANCE_ADMIN_BLOCK_CLASS}__title`}>
          {t('bpmn-admin.instance-administration', { instanceId: dispInstanceId })}
        </h5>
        {isSuspended === true && (
          <IcoBtn icon="fa fa-pause" className="ecos-btn_transparent" title={t('instance-admin.info-widget.paused')} />
        )}
      </div>
      <MetaInfo instanceId={instanceId} />
      <BpmnSchema labels={labels} selectMetaInfo={selectMetaInfo} activityElement={activityElement} />
      <JournalsTabs instanceId={instanceId} />
    </div>
  );
};

export default BpmnAdminInstanceDashboard;
