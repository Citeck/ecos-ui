import React, { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import RecordActions from '../../../../../components/Records/actions/recordActions';
import { getActionsInfo, getJournalTabInfo, getMetaInfo } from '../../../../../actions/instanceAdmin';
import { selectInstanceActions, selectInstanceMetaInfo } from '../../../../../selectors/instanceAdmin';
import PanelTitle, { COLOR_GRAY } from '../../../../../components/common/PanelTitle/PanelTitle';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Btn } from '../../../../../components/common/btns';
import { INSTANCE_TABS_TYPES } from '../../../../../constants/instanceAdmin';
import { URL } from '../../../../../constants';
import { InstanceContext } from '../../../InstanceContext';
import { META_INFO_BLOCK_CLASS } from '../../../constants';
import PageTabList from '../../../../../services/pageTabs/PageTabList';
import MutateAction from '../../../../../components/Records/actions/handler/executor/MutateAction';
import { t } from '../../../../../helpers/util';
import PageService from '../../../../../services/PageService';
import Labels from '../../Labels';

const ActionsButton = ({ instanceId, metaInfo, actionsInfo, getActionsInfo, getDataInfo, getMetaInfo }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { activeTabId } = useContext(InstanceContext);

  useEffect(
    () => {
      if (isEmpty(actionsInfo)) {
        isFunction(getActionsInfo) && getActionsInfo(instanceId);
      }
    },
    [instanceId]
  );

  return (
    <div className={`${META_INFO_BLOCK_CLASS}__main-item`}>
      <PanelTitle narrow color={COLOR_GRAY}>
        {t(Labels.ACTIONS_TITLE)}
      </PanelTitle>
      <Dropdown isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}>
        <DropdownToggle tag="div">
          <Btn className={`${META_INFO_BLOCK_CLASS}__actions ecos-btn_blue`}>
            {t(Labels.CHOUSE_ACTION)}
            <i className="icon-small-down" />
          </Btn>
        </DropdownToggle>
        <DropdownMenu container="body" right>
          {(actionsInfo.data || []).map(action => {
            return (
              <DropdownItem
                key={action.label}
                onClick={() => {
                  RecordActions.execForRecord(instanceId, action).then(recordWasChanged => {
                    if (recordWasChanged) {
                      if (action.type === MutateAction.ACTION_ID && action.id && !action.id.includes('delete')) {
                        isFunction(getMetaInfo) && getMetaInfo(instanceId);
                      }

                      if (action.id && action.id.includes('delete')) {
                        const activeTab = PageTabList.activeTab;

                        PageService.changeUrlLink(`${URL.BPMN_ADMIN_PROCESS}?recordRef=${metaInfo.bpmnDefEngine}`, {
                          openNewTab: true
                        });

                        PageTabList.delete(activeTab);
                      }

                      if (action.id && action.id.includes('add') && activeTabId === INSTANCE_TABS_TYPES.VARIABLES) {
                        isFunction(getDataInfo) && getDataInfo(instanceId, activeTabId);
                      }
                    }
                  });
                }}
              >
                {action.name}
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectInstanceMetaInfo(store, props),
  actionsInfo: selectInstanceActions(store, props)
});

const mapDispatchToProps = dispatch => ({
  getActionsInfo: instanceId => dispatch(getActionsInfo({ instanceId })),
  getMetaInfo: instanceId => dispatch(getMetaInfo({ instanceId })),
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActionsButton);
