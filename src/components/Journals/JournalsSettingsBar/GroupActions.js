import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { execRecordsAction, setSelectAllRecords, setSelectedRecords } from '../../../actions/journals';
import { selectGroupActionsProps } from '../../../selectors/journals';
import { DropdownOuter } from '../../common/form';

const Labels = {
  SELECTED: 'journal.group-actions.selected-records'
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

const GroupActions = props => {
  const {
    isMobile,
    selectAllRecordsVisible,
    selectAllRecords,
    grid,
    selectedRecords,
    onExecuteAction,
    className,

    onSelectAll,
    forwardedRef
  } = props;

  if (isEmpty(selectedRecords) && !selectAllRecords) {
    return null;
  }

  const total = get(grid, 'total', 0);
  const recordsActions = get(grid, 'actions.forRecords.actions', {});
  const queryActions = get(grid, 'actions.forQuery.actions', {});

  const onChange = () => {};

  const onSelectAllRecords = () => {
    const { setSelectAllRecords, selectAllRecords, setSelectedRecords } = this.props;

    setSelectAllRecords(!selectAllRecords);

    if (!selectAllRecords) {
      setSelectedRecords([]);
    }
  };

  const onExecuteGroupAction = action => {
    const { selectAllRecords } = this.props;

    if (!selectAllRecords) {
      const records = get(this.props, 'selectedRecords', []);

      this.props.execRecordsAction(records, action);
    } else {
      const query = get(this.props, 'grid.query');

      this.props.execRecordsAction(query, action);
    }
  };

  return (
    <>
      <DropdownOuter
        isStatic
        valueField={'id'}
        titleField={'pluralName'}
        keyFields={['id', 'formRef', 'pluralName']}
        source={recordsActions}
        controlLabel={t(Labels.SELECTED, { selected: selectAllRecordsVisible ? total : selectedRecords.length, total })}
        className="group-actions__dropdown"
        menuClassName="999"
        controlClassName="ecos-btn_hover_blue2 ecos-btn_grey3 group-actions__control"
        onChange={onChange}
      />

      <DropdownOuter
        isStatic
        valueField={'id'}
        titleField={'pluralName'}
        keyFields={['id', 'formRef', 'pluralName']}
        source={queryActions}
        controlLabel={'Результат фильтрации'}
        className="group-actions__dropdown"
        menuClassName=""
        controlClassName="ecos-btn_hover_blue2 ecos-btn_grey3 group-actions__control"
        onChange={onChange}
      />
    </>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GroupActions);
