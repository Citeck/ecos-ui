import React, { useEffect, useState, useContext } from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import RecordActions from '../../../../../components/Records/actions/recordActions';
import PanelTitle, { COLOR_GRAY } from '../../../../../components/common/PanelTitle/PanelTitle';
import { Btn } from '../../../../../components/common/btns';
import { t } from '../../../../../helpers/util';
import { selectProcessActions, selectProcessMetaInfo } from '../../../../../selectors/processAdmin';
import { getActionsInfo } from '../../../../../actions/processAdmin';
import { ProcessContext } from '../../../ProcessContext';

const ActionsButton = ({ processId, actionsInfo, getActionsInfo }) => {
  const { selectedVersion } = useContext(ProcessContext);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(
    () => {
      if (isEmpty(actionsInfo)) {
        isFunction(getActionsInfo) && getActionsInfo(processId);
      }
    },
    [processId]
  );

  if (isEmpty(actionsInfo) || isEmpty(actionsInfo.data)) {
    return null;
  }

  return (
    <>
      <PanelTitle narrow color={COLOR_GRAY}>
        {t('instance-admin.info-widget.actions-title')}
      </PanelTitle>
      <Dropdown isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}>
        <DropdownToggle tag="div">
          <Btn className={`info-panel__actions ecos-btn_blue`}>
            {t('instance-admin.info-widget.choose-action')}
            <i className="icon-small-down" />
          </Btn>
        </DropdownToggle>
        <DropdownMenu container="body" right>
          {(actionsInfo.data || []).map(action => {
            return (
              <DropdownItem
                key={action.label}
                onClick={() => {
                  const { version } = selectedVersion;
                  RecordActions.execForRecord(processId, {
                    ...action,
                    config: {
                      ...action.config,
                      args: {
                        recordRef: processId,
                        version
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
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectProcessMetaInfo(store, props),
  actionsInfo: selectProcessActions(store, props)
});

const mapDispatchToProps = dispatch => ({
  getActionsInfo: processId => dispatch(getActionsInfo({ processId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActionsButton);
