import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { loadFilesViewerData, startSearch, createNode } from '../../../../actions/docLib';
import { selectDocLibCreateVariants, selectDocLibSearchText } from '../../../../selectors/docLib';

import DocLibSettingsBar from './DocLibSettingsBar';

const mapStateToProps = (state, { stateId }) => {
  const createVariants = selectDocLibCreateVariants(state, stateId);
  const searchText = selectDocLibSearchText(state, stateId);

  return {
    createVariants,
    searchText
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);
  return {
    onRefresh: () => dispatch(loadFilesViewerData(w())),
    startSearch: text => dispatch(startSearch(w(text))),
    createNode: data => dispatch(createNode(w(data)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocLibSettingsBar);
