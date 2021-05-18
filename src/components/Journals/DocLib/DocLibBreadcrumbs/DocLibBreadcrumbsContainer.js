import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { openFolder } from '../../../../actions/docLib';
import { selectDocLibFolderPath } from '../../../../selectors/docLib';

import DocLibBreadcrumbs from './DocLibBreadcrumbs';

const mapStateToProps = (state, { stateId }) => {
  const path = selectDocLibFolderPath(state, stateId);

  return {
    path
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);
  return {
    onClick: id => {
      dispatch(openFolder(w(id)));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocLibBreadcrumbs);
