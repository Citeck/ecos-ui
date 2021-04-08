import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { setFileViewerPagination, loadFilesViewerData } from '../../../../actions/docLib';
import { selectDocLibFileViewerIsReady, selectDocLibFileViewerTotal, selectDocLibFileViewerPagination } from '../../../../selectors/docLib';

import DocLibPagination from './DocLibPagination';

const mapStateToProps = (state, { stateId }) => {
  const isReady = selectDocLibFileViewerIsReady(state, stateId);
  const pagination = selectDocLibFileViewerPagination(state, stateId);
  const total = selectDocLibFileViewerTotal(state, stateId);

  return {
    isReady,
    pagination,
    total
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);
  return {
    onChange: pagination => {
      dispatch(setFileViewerPagination(w(pagination)));
      dispatch(loadFilesViewerData(w()));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocLibPagination);
