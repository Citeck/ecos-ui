import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { execRecordsAction, setSelectAllRecords, setSelectedRecords } from '../../../actions/journals';
import { selectGroupActionsProps } from '../../../selectors/journals';
import { DropdownOuter } from '../../common/form';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Tooltip } from '../../common';

import './style.scss';

const Labels = {
  SELECTED: 'journal.group-actions.selected-records.label',
  SELECTED_SHORT: 'journal.group-actions.selected-records.label_short',
  SELECTED_COUNT: 'journal.group-actions.selected-records.label-count',
  SELECTED_TIP: 'journal.group-actions.selected-records.tooltip',
  SELECTED_TIP_RESULT: 'journal.group-actions.selected-records.tooltip-result',
  RESULT: 'journal.group-actions.filter-result'
};

const TYPE_ACT = {
  QUERY: 'forQuery',
  RECORDS: 'forRecords'
};

const GroupActions = React.memo(
  props => {
    const [isOpenRecActions, setOpenRecActions] = useState(false);
    const [isOpenQueryActions, setOpenQueryActions] = useState(false);
    const [targetRecActions] = useState(uniqueId('group-actions-rec-'));
    const [tooltipRecActions, setTooltipRecActions] = useState('');
    const [recordsActions, setRecordsActions] = useState([]);
    const [queryActions, setQueryActions] = useState([]);

    const { isMobile, grid, selectAllRecordsVisible, selectedRecords, execRecordsAction, separatedDropdownActionsForAll } = props;

    const total = get(grid, 'total', 0);
    const selectedLen = selectedRecords.length;
    const selected = selectAllRecordsVisible ? total : selectedLen;
    const labelRecActionsCount = t(Labels.SELECTED_COUNT, { selected, total });
    const labelRecActions = t(isMobile ? Labels.SELECTED_SHORT : Labels.SELECTED, { data: labelRecActionsCount });

    useEffect(() => {
      const recordsActions = get(grid, 'actions.forRecords.actions', []).map(item => ({ ...item, _handler: TYPE_ACT.RECORDS }));
      const queryActions = get(grid, 'actions.forQuery.actions', []).map(item => ({ ...item, _handler: TYPE_ACT.QUERY }));

      if (!separatedDropdownActionsForAll) {
        recordsActions.push(...queryActions);
        queryActions.length = 0;
      }

      setRecordsActions(recordsActions);
      setQueryActions(queryActions);
    }, [grid, separatedDropdownActionsForAll]);

    useEffect(() => {
      let tooltipRecActions = labelRecActionsCount;

      if (selectAllRecordsVisible && separatedDropdownActionsForAll) {
        tooltipRecActions = t(Labels.SELECTED_TIP);
        !isEmpty(queryActions) && (tooltipRecActions += t(Labels.SELECTED_TIP_RESULT, { list: t(Labels.RESULT) }));
      }

      setTooltipRecActions(tooltipRecActions);
    }, [selectAllRecordsVisible, separatedDropdownActionsForAll]);

    const handleExecuteAction = useCallback(
      action => {
        if (action._handler === TYPE_ACT.QUERY) {
          execRecordsAction(grid.query, action);
        } else if (action._handler === TYPE_ACT.RECORDS) {
          execRecordsAction(selectedRecords, action);
        }
      },
      [grid, selectedRecords]
    );

    const getItemClassName = useCallback(
      action => {
        const disabled = action._handler === TYPE_ACT.RECORDS && (selectAllRecordsVisible || !selectedLen);
        return classNames('ecos-group-actions__dropdown-item', {
          'ecos-group-actions__dropdown-item_disabled': disabled,
          'ecos-group-actions__dropdown-item_query': action._handler === TYPE_ACT.QUERY
        });
      },
      [selectAllRecordsVisible, !!selectedLen]
    );

    const iconOpener = useCallback(flag => classNames('ecos-btn__i_right', { 'icon-small-up': flag, 'icon-small-down': !flag }), []);

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
            menuClassName="ecos-group-actions__dropdown-menu"
            getStateOpen={setOpenRecActions}
            onChange={handleExecuteAction}
            itemClassName={getItemClassName}
          >
            <Tooltip uncontrolled showAsNeeded target={targetRecActions} text={labelRecActions} contentComponent={tooltipRecActions}>
              <IcoBtn
                invert
                className="ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control"
                icon={iconOpener(isOpenRecActions)}
                id={targetRecActions}
              >
                {labelRecActions}
              </IcoBtn>
            </Tooltip>
          </DropdownOuter>
        )}

        {separatedDropdownActionsForAll && !isEmpty(queryActions) && (
          <DropdownOuter
            isStatic
            valueField={'id'}
            titleField={'pluralName'}
            keyFields={['id', 'formRef', 'pluralName']}
            source={queryActions}
            className="ecos-group-actions__dropdown"
            controlClassName="ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control"
            menuClassName="ecos-group-actions__dropdown-menu"
            onChange={handleExecuteAction}
            getStateOpen={setOpenQueryActions}
          >
            <TwoIcoBtn
              invert
              className={classNames('ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control', {
                'ecos-group-actions__control_mobile': isMobile
              })}
              icons={[classNames({ 'icon-filter icon_semantic': isMobile }), iconOpener(isOpenQueryActions)]}
              id={targetRecActions}
            >
              {!isMobile && t(Labels.RESULT)}
            </TwoIcoBtn>
          </DropdownOuter>
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

const mapStateToProps = (state, props) => {
  const ownState = selectGroupActionsProps(state, props.stateId);

  return {
    isMobile: get(state, 'view.isMobile'),
    separatedDropdownActionsForAll: get(state, 'app.journalSeparatedDropdownActionsForAll', false),
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GroupActions);
