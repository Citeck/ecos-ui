import React from 'react';
import { connect } from 'react-redux';
import { wrapArgs } from '../../../helpers/redux';
import { Dropdown } from '../../common/form';
import { setGrouping } from '../../../actions/journals';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    grouping: newState.grouping,
    columnsSetup: newState.columnsSetup
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setGrouping: grouping => dispatch(setGrouping(w(grouping)))
  };
};

const GroupActions = ({ grouping }) => {
  const onChange = () => {};

  const source = [];

  return (
    <>
      <Dropdown
        hasEmpty
        isStatic
        source={source}
        titleField="title"
        controlLabel={'Выбранные заявки: 1 из 963'}
        className="group-actions__dropdown"
        menuClassName=""
        controlClassName="ecos-btn_hover_blue2 ecos-btn_grey3 group-actions__control"
        onChange={onChange}
      />

      <Dropdown
        hasEmpty
        isStatic
        source={source}
        titleField="title"
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
