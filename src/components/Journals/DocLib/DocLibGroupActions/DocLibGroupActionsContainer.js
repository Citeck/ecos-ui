import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { execGroupAction } from '../../../../actions/docLib';
import { selectDocLibFileViewer, selectDocLibGroupActions } from '../../../../selectors/docLib';

import DocLibGroupActions from './DocLibGroupActions';

const mapStateToProps = (state, { stateId }) => {
  const fileViewer = selectDocLibFileViewer(state, stateId);
  const groupActions = selectDocLibGroupActions(state, stateId);

  return {
    total: fileViewer.total,
    groupActions
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);
  return {
    execGroupAction: action => {
      dispatch(execGroupAction(w(action)));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocLibGroupActions);
