import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import isFunction from 'lodash/isFunction';

import { getMetaInfo } from '../../../actions/instanceAdmin';
import { META_INFO_BLOCK_CLASS } from '../constants';
import PanelTitle, { COLOR_GRAY } from '../../../components/common/PanelTitle/PanelTitle';
import { t } from '../../../helpers/util';
import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import { Btn } from '../../../components/common/btns';
import PageService from '../../../services/PageService';
import { createDocumentUrl } from '../../../helpers/urls';
import Labels from './Labels';

const InfoPanel = ({ instanceId, metaInfo, getMetaInfo }) => {
  useEffect(
    () => {
      isFunction(getMetaInfo) && getMetaInfo(instanceId);
    },
    [instanceId]
  );

  const handleLinkClick = href => {
    PageService.changeUrlLink(createDocumentUrl(href), {
      openNewTab: true
    });
  };

  return (
    <div className={META_INFO_BLOCK_CLASS}>
      <div className={`${META_INFO_BLOCK_CLASS}__secondary`}>
        <span>{`${t(Labels.META_INFO_VERSION)}: ${metaInfo.version || t(Labels.META_INFO_NOT_DEFINED)}`}</span>
      </div>

      <div className={`${META_INFO_BLOCK_CLASS}__main-item`}>
        <PanelTitle narrow color={COLOR_GRAY}>
          {t(Labels.META_INFO_DEFINITION_REF)}
        </PanelTitle>
        <Btn className="ecos-btn_blue" onClick={() => handleLinkClick(metaInfo.definitionRefId)} disabled={!metaInfo.definitionRef}>
          {metaInfo.definitionRef || t(Labels.META_INFO_NOT_DEFINED)}
          <i className="icon-small-right" />
        </Btn>
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
)(InfoPanel);
