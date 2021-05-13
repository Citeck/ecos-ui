import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import {
  selectDocLibFileViewer,
  selectDocLibFileViewerLoadingStatus,
  selectDocLibFolderPath,
  selectDocLibGroupActions
} from '../../../../selectors/docLib';
import { openFolder, setFileViewerSelected, setFileViewerLastClicked, uploadFiles } from '../../../../actions/docLib';

import FilesViewer from './FilesViewer';

const mapStateToProps = (state, { stateId }) => {
  const fileViewer = selectDocLibFileViewer(state, stateId);
  const groupActions = selectDocLibGroupActions(state, stateId);
  const path = selectDocLibFolderPath(state, stateId);
  const isLoading = selectDocLibFileViewerLoadingStatus(state, stateId);

  return {
    fileViewer,
    groupActions,
    path,
    isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    openFolder: id => dispatch(openFolder(w(id))),
    setSelected: id => dispatch(setFileViewerSelected(w(id))),
    setLastClicked: id => dispatch(setFileViewerLastClicked(w(id))),
    onDrop: data => dispatch(uploadFiles(w(data)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesViewer);
