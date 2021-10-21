import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';
import isNil from 'lodash/isNil';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { execRecordsAction } from '../../../actions/journals';
import { selectGroupActionsProps } from '../../../selectors/journals';
import { DropdownOuter } from '../../common/form';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Tooltip } from '../../common';

import './style.scss';

const Labels = {
  SELECTED: 'journal.group-actions.selected-records.label',
  SELECTED_SHORT: 'journal.group-actions.selected-records.label_short',
  SELECTED_COUNT: 'journal.group-actions.selected-records.label-count',
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
    const [targetPrefix] = useState(uniqueId('group-actions-'));
    const [recordsActions, setRecordsActions] = useState([]);
    const [queryActions, setQueryActions] = useState([]);

    const { isMobile, grid, selectAllRecordsVisible, selectedRecords, execRecordsAction, isSeparateActionListForQuery } = props;

    const total = get(grid, 'total', 0);
    const selectedLen = selectedRecords.length;
    const selected = selectAllRecordsVisible ? total : selectedLen;
    const labelRecActionsCount = t(Labels.SELECTED_COUNT, { selected, total });
    const labelRecActions = t(isMobile ? Labels.SELECTED_SHORT : Labels.SELECTED, { data: labelRecActionsCount });

    useEffect(() => {
      const recordsActions = get(grid, 'actions.forRecords.actions', []).map(item => ({ ...item, _typeAct: TYPE_ACT.RECORDS }));
      const queryActions = get(grid, 'actions.forQuery.actions', []).map(item => ({ ...item, _typeAct: TYPE_ACT.QUERY }));

      if (!isSeparateActionListForQuery) {
        recordsActions.push(...queryActions);
      }

      setRecordsActions(recordsActions);
      setQueryActions(queryActions);
    }, [grid, isSeparateActionListForQuery]);

    const handleExecuteAction = useCallback(
      action => {
        if (action._typeAct === TYPE_ACT.QUERY) {
          execRecordsAction(grid.query, action);
        } else if (action._typeAct === TYPE_ACT.RECORDS) {
          execRecordsAction(selectedRecords, action);
        }
      },
      [grid, selectedRecords]
    );

    const getItemClassName = useCallback(
      action => {
        const disabled = action._typeAct === TYPE_ACT.RECORDS && (selectAllRecordsVisible || !selectedLen);
        return classNames('ecos-group-actions__dropdown-item', {
          'ecos-group-actions__dropdown-item_disabled': disabled,
          'ecos-group-actions__dropdown-item_query': action._typeAct === TYPE_ACT.QUERY
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
            keyFields={['id', 'formRef', 'pluralName', '_typeAct']}
            source={recordsActions}
            className="ecos-group-actions__dropdown"
            menuClassName="ecos-group-actions__dropdown-menu"
            getStateOpen={setOpenRecActions}
            onChange={handleExecuteAction}
            itemClassName={getItemClassName}
          >
            <Tooltip
              uncontrolled
              showAsNeeded
              target={targetPrefix + '-rec'}
              text={labelRecActions}
              contentComponent={labelRecActionsCount}
            >
              <IcoBtn
                invert
                className="ecos-btn_hover_blue2 ecos-btn_grey3 ecos-group-actions__control"
                icon={iconOpener(isOpenRecActions)}
                id={targetPrefix + '-rec'}
              >
                {labelRecActions}
              </IcoBtn>
            </Tooltip>
          </DropdownOuter>
        )}
        {isSeparateActionListForQuery && !isEmpty(queryActions) && (
          <DropdownOuter
            isStatic
            valueField={'id'}
            titleField={'pluralName'}
            keyFields={['pluralName', '_typeAct']}
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
              id={targetPrefix}
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
    isMobile: isNil(props.isMobile) ? get(state, 'view.isMobile') : props.isMobile,
    isSeparateActionListForQuery: get(state, 'app.isSeparateActionListForQuery', false),
    ...ownState
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context })))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GroupActions);
