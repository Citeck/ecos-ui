import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { Btn, IcoBtn } from '../../../components/common/btns';
import { EcosModal, Icon, InfoText, SaveAndCancelButtons } from '../../../components/common';
import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import { ScaleOptions } from '../../../components/common/Scaler/util';
import { MIGRATION_MODAL_BLOCK_CLASS } from '../constants';
import { Checkbox, Input } from '../../../components/common/form';
import ModelViewer from '../../../components/ModelViewer/ModelViewer';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import Records from '../../../components/Records';
import { notifyFailure, notifySuccess } from '../../../components/Records/actions/util/actionUtils';
import { getMetaInfo } from '../../../actions/instanceAdmin';
import { t } from '../../../helpers/util';
import Labels from './Labels';

import './style.scss';

const designer = new ModelViewer();
const Sheet = designer && designer.renderSheet;

const MigrationModal = ({ instanceId, metaInfo, getMetaInfo }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [rect, setRect] = useState(null);
  const [element, setElement] = useState(null);

  const [initial, setInitial] = useState(null);
  const [target, setTarget] = useState(null);

  const [skipCustomListeners, setSkipCustomListeners] = useState(false);
  const [skipIoMappings, setSkipIoMappings] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsTooltipOpen(false);
    };

    document.addEventListener('wheel', handler);

    return () => {
      document.removeEventListener('wheel', handler);
    };
  }, []);

  useEffect(
    () => {
      designer &&
        designer.markElements({
          [initial]: 'initial-element',
          [target]: 'target-element'
        });
    },
    [initial, target]
  );

  const handleClickElement = (_event, elementInfo) => {
    if (is(elementInfo.element, 'bpmn:Definition') || !get(elementInfo, 'element.parent')) {
      setIsTooltipOpen(false);
      return;
    }

    setElement(get(elementInfo, 'element.id'));
    const modal = document.querySelector('.migration-modal');
    if (!modal) {
      return;
    }

    const targetDoc = modal.querySelector(`[data-element-id="${get(elementInfo, 'element.id')}"]`);

    if (targetDoc) {
      const rect = targetDoc.getBoundingClientRect();
      setIsTooltipOpen(true);
      setRect(rect);
    }
  };

  const handleSelectButton = (key, el) => {
    switch (key) {
      case 'initial':
        setInitial(el);
        setIsTooltipOpen(false);
        break;
      case 'target':
        setTarget(el);
        setIsTooltipOpen(false);
        break;
      default:
        return;
    }
  };

  const handleMigrate = () => {
    setIsLoading(true);

    const instanceRecord = Records.get(instanceId);

    const data = {
      skipCustomListeners,
      skipIoMappings,
      instructions: [
        {
          type: 'cancel',
          activityId: initial
        },
        {
          type: 'startBeforeActivity',
          activityId: target
        }
      ]
    };

    instanceRecord.att('action', 'MODIFY');
    instanceRecord.att('data', data);

    instanceRecord
      .save()
      .then(() => {
        notifySuccess();
        setIsConfirmModalOpen(false);
        setIsLoading(false);
        setTarget(null);
        setInitial(null);

        isFunction(getMetaInfo) && getMetaInfo(instanceId);
      })
      .catch(e => {
        notifyFailure(e.message);
        setIsConfirmModalOpen(false);
        setIsLoading(false);
      });
  };

  const renderBadges = () => {
    if (!metaInfo || !Array.isArray(metaInfo.activityStatistics)) {
      return;
    }

    const getInstancesCount = item => {
      return item.incidentStatistics.reduce((result, current) => result + current.count, 0);
    };

    designer.drawBadges({
      data: metaInfo.activityStatistics.map(item => ({
        ...item,
        id: item.activityId,
        incidents: getInstancesCount(item) || undefined,
        titles: {
          instances: t('bpmn-admin.process-tabs.process-instances'),
          incidents: t('bpmn-admin.process-tabs.process-incidents')
        }
      })),
      keys: ['instances', 'incidents']
    });
  };

  useEffect(
    () => {
      renderBadges();
    },
    [metaInfo?.bpmnDefinition]
  );

  const handleReadySheet = ({ mounted, result }) => {
    if (mounted) {
      renderBadges();
    } else {
      console.warn({ result });
    }
  };

  const zoomCenter = {
    x: 0,
    y: 0
  };

  const noData = metaInfo.bpmnDefinition === null;

  return (
    <>
      <div className={MIGRATION_MODAL_BLOCK_CLASS}>
        {noData && <InfoText text={t('instance-admin.schema-widget.no-schema')} />}
        {!noData && (
          <>
            {Sheet && (
              <Sheet
                diagram={metaInfo.bpmnDefinition}
                zoom={ScaleOptions.FIT}
                zoomCenter={zoomCenter}
                onMounted={handleReadySheet}
                modelEvents={{
                  'element.click': handleClickElement
                }}
              />
            )}
            <div className={`${MIGRATION_MODAL_BLOCK_CLASS}__inputs-panel`}>
              <div>
                <span>{t(Labels.INITIAL_TOKEN)}</span>
                <div className={`${MIGRATION_MODAL_BLOCK_CLASS}__text-input`}>
                  <Input className={`${MIGRATION_MODAL_BLOCK_CLASS}__input`} type="text" value={initial} disabled />
                  {initial && (
                    <IcoBtn className="ecos-btn_transparent" icon="icon-small-close" onClick={() => handleSelectButton('initial', '')} />
                  )}
                </div>
              </div>
              <div>
                <span>{t(Labels.TARGET_TOKEN)}</span>
                <div className={`${MIGRATION_MODAL_BLOCK_CLASS}__text-input`}>
                  <Input className={`${MIGRATION_MODAL_BLOCK_CLASS}__input`} type="text" value={target} disabled />
                  {target && (
                    <IcoBtn className="ecos-btn_transparent" icon="icon-small-close" onClick={() => handleSelectButton('target', '')} />
                  )}
                </div>
              </div>
              <Btn
                className={`${MIGRATION_MODAL_BLOCK_CLASS}__button ecos-btn_blue`}
                disabled={!initial || !target}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                {t(Labels.MIGRATE)}
              </Btn>
            </div>
            {isTooltipOpen && rect && (
              <div style={{ position: 'fixed', top: rect.top - Math.min(50, rect.height), left: rect.left + Math.min(100, rect.width) }}>
                <div className={`${MIGRATION_MODAL_BLOCK_CLASS}__tooltip-panel`}>
                  <Icon className="ecos-btn_transparent icon-small-close" onClick={() => setIsTooltipOpen(false)} />
                  <Btn className="ecos-btn_transparent" onClick={() => handleSelectButton('initial', element)}>
                    {t(Labels.INITIAL_TOKEN)}
                  </Btn>
                  <Btn className="ecos-btn_transparent" onClick={() => handleSelectButton('target', element)}>
                    {t(Labels.TARGET_TOKEN)}
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <EcosModal title={t(Labels.CONFIRM_TITLE)} isOpen={isConfirmModalOpen} hideModal={() => setIsConfirmModalOpen(false)}>
        <div className={`${MIGRATION_MODAL_BLOCK_CLASS}__confirm`}>
          <span>{t(Labels.CONFIRM_QUESTION, { initial, target })}</span>

          <Checkbox checked={skipCustomListeners} onChange={({ checked }) => setSkipCustomListeners(checked)}>
            {t(Labels.SKIP_CUSTOM_LISTENERS)}
            <Icon className="icon-question" title={t(Labels.SKIP_CUSTOM_LISTENERS_TITLE)} />
          </Checkbox>

          <Checkbox checked={skipIoMappings} onChange={({ checked }) => setSkipIoMappings(checked)}>
            {t(Labels.SKIP_IO_MAPPINGS)}
            <Icon className="icon-question" title={t(Labels.SKIP_IO_MAPPINGS_TITLE)} />
          </Checkbox>

          <SaveAndCancelButtons
            handleCancel={() => setIsConfirmModalOpen(false)}
            handleSave={handleMigrate}
            saveText={t(Labels.MIGRATE)}
            disabledSave={isLoading}
            loading={isLoading}
          />
        </div>
      </EcosModal>
    </>
  );
};

const mapStateToProps = (state, props) => ({
  metaInfo: selectInstanceMetaInfo(state, props)
});

const mapDispatchToProps = dispatch => ({
  getMetaInfo: instanceId => dispatch(getMetaInfo({ instanceId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MigrationModal);
