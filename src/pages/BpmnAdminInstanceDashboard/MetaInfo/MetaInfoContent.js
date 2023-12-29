import React, { useContext, useEffect } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';

import isFunction from 'lodash/isFunction';

import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import PanelTitle, { COLOR_GRAY } from '../../../components/common/PanelTitle/PanelTitle';
import { Btn } from '../../../components/common/btns';
import PageService from '../../../services/PageService';
import { createDocumentUrl } from '../../../helpers/urls';
import { getMetaInfo } from '../../../actions/instanceAdmin';
import { t } from '../../../helpers/util';
import { InstanceContext } from '../InstanceContext';
import { META_INFO_BLOCK_CLASS } from '../constants';
import Labels from './Labels';
import { ActionsButton } from './components';

const MetaInfoContent = ({ getMetaInfo, metaInfo }) => {
  const { instanceId, setIsSuspended } = useContext(InstanceContext);
  useEffect(
    () => {
      isFunction(getMetaInfo) && getMetaInfo(instanceId);
    },
    [instanceId]
  );

  useEffect(
    () => {
      if (metaInfo) {
        setIsSuspended(metaInfo.isSuspended);
      }
    },
    [metaInfo]
  );

  const handleLinkClick = href => {
    PageService.changeUrlLink(createDocumentUrl(href), {
      openNewTab: true
    });
  };

  return (
    <div className={META_INFO_BLOCK_CLASS}>
      <div className={`${META_INFO_BLOCK_CLASS}__main`}>
        <div className={`${META_INFO_BLOCK_CLASS}__main-item`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.DOCUMENT)}
          </PanelTitle>
          <Btn className="ecos-btn_blue" onClick={() => handleLinkClick(metaInfo.documentId)} disabled={!metaInfo.document}>
            {metaInfo.document || t(Labels.NOT_DEFINED)}
            <i className="icon-small-right" />
          </Btn>
        </div>

        <ActionsButton instanceId={instanceId} />

        <div className={`${META_INFO_BLOCK_CLASS}__main-item`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.DEFINITION_REF)}
          </PanelTitle>
          <Btn className="ecos-btn_blue" onClick={() => handleLinkClick(metaInfo.definitionRefId)} disabled={!metaInfo.definitionRef}>
            {metaInfo.definitionRef || t(Labels.NOT_DEFINED)}
            <i className="icon-small-right" />
          </Btn>
        </div>
      </div>

      <div className={`${META_INFO_BLOCK_CLASS}__secondary`}>
        <span>{`${t(Labels.VERSION)}: ${metaInfo.version || t(Labels.NOT_DEFINED)}`}</span>
        <span>{`${t(Labels.START_TIME)}: ${metaInfo.startTime ? moment(metaInfo.startTime).format('LLL') : t(Labels.NOT_DEFINED)}`}</span>
      </div>
    </div>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectInstanceMetaInfo(store, props)
});

const mapDispatchToProps = dispatch => ({
  getMetaInfo: instanceId => dispatch(getMetaInfo({ instanceId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MetaInfoContent);
