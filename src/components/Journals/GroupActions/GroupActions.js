import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { execRecordsAction, setSelectAllRecords, setSelectedRecords } from '../../../actions/journals';
import { selectGroupActionsProps } from '../../../selectors/journals';
import { DropdownOuter } from '../../common/form';
import { IcoBtn } from '../../common/btns';

import './style.scss';

const Labels = {
  SELECTED: 'journal.group-actions.selected-records',
  RESULT: 'journal.group-actions.filter-result'
};

const mapStateToProps = (state, props) => {
  const ownState = selectGroupActionsProps(state, props.stateId);

  return {
    isMobile: get(state, 'view.isMobile'),
    ...ownState
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context })))
  };
};

const GroupActions = React.memo(
  props => {
    const [isOpenRecActions, setOpenRecActions] = useState(false);
    const { isMobile, grid, selectAllRecordsVisible, selectedRecords, execRecordsAction } = props;

    const total = get(grid, 'total', 0);
    const recordsActions = get(grid, 'actions.forRecords.actions', {});
    const queryActions = get(grid, 'actions.forQuery.actions', {});
    const selected = selectAllRecordsVisible ? total : selectedRecords.length;

    const handleExecuteRecAction = useCallback(action => execRecordsAction(selectedRecords, action), [selectedRecords]);
    const handleExecuteQueryAction = useCallback(action => execRecordsAction(grid.query, action), [grid]);
    //todo объединение дропов при установке конфига
    return (
      <>
        {!isEmpty(recordsActions) && (
          <DropdownOuter
            isStatic
            valueField={'id'}
            titleField={'pluralName'}
            keyFields={['id', 'formRef', 'pluralName']}
            source={recordsActions}
            className="ecos-group-actions__dropdown"
            menuClassName={classNames('ecos-group-actions__dropdown-menu', {
              'ecos-group-actions__dropdown-menu_disabled': isEmpty(selectedRecords)
            })}
            getStateOpen={setOpenRecActions}
            onChange={handleExecuteRecAction}
          >
            {/*todo tooltip if big*/}
            <IcoBtn
              className="ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control"
              invert
              icon={isOpenRecActions ? 'icon-small-up' : 'icon-small-down'}
            >
              {t(Labels.SELECTED, { selected, total })}
            </IcoBtn>
          </DropdownOuter>
        )}

        {!isEmpty(queryActions) && (
          <DropdownOuter
            isStatic
            valueField={'id'}
            titleField={'pluralName'}
            keyFields={['id', 'formRef', 'pluralName']}
            source={queryActions}
            controlLabel={t(Labels.RESULT)}
            className="ecos-group-actions__dropdown"
            controlClassName="ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control"
            menuClassName="ecos-group-actions__dropdown-menu"
            onChange={handleExecuteQueryAction}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) =>
    isEqual(prevProps.stateId, nextProps.stateId) &&
    isEqual(prevProps.grid, nextProps.grid) &&
    isEqual(prevProps.selectAllRecordsVisible, nextProps.selectAllRecordsVisible) &&
    isEqual(prevProps.selectedRecords, nextProps.selectedRecords)
);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GroupActions);
