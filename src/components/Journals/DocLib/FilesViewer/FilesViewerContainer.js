import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { selectFilesViewerProps } from '../../../../selectors/docLib';
import { initDocLib, openFolder, setFileViewerLastClicked, setFileViewerSelected, uploadFiles } from '../../../../actions/docLib';

import FilesViewer from './FilesViewer';

const mapStateToProps = (state, { stateId }) => selectFilesViewerProps(state, stateId);

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    openFolder: id => dispatch(openFolder(w(id))),
    setSelected: id => dispatch(setFileViewerSelected(w(id))),
    setLastClicked: id => dispatch(setFileViewerLastClicked(w(id))),
    onDrop: data => dispatch(uploadFiles(w(data))),
    onInitData: id => dispatch(initDocLib(w(id)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesViewer);
