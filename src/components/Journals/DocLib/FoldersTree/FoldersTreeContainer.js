import { connect } from 'react-redux';

import { wrapArgs } from '../../../../helpers/redux';
import { selectDocLibSidebar, selectDocLibFolderId } from '../../../../selectors/docLib';
import { openFolder, unfoldSidebarItem, foldSidebarItem } from '../../../../actions/docLib';

import FoldersTree from './FoldersTree';

const mapStateToProps = (state, { stateId }) => {
  const sidebar = selectDocLibSidebar(state, stateId);
  const selected = selectDocLibFolderId(state, stateId) || null;
  return {
    hasError: sidebar.hasError,
    isReady: sidebar.isReady,
    items: sidebar.items,
    selected
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);
  return {
    onSelect: id => {
      dispatch(openFolder(w(id)));
      if (props.isMobile && typeof props.closeMenu === 'function') {
        props.closeMenu();
      }
    },
    onUnfold: id => dispatch(unfoldSidebarItem(w(id))),
    onFold: id => dispatch(foldSidebarItem(w(id)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FoldersTree);
