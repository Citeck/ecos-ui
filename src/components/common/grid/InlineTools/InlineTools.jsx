import { connect } from 'react-redux';
import get from 'lodash/get';

import InlineTools from './InlineToolsComponent';

const mapStateToProps = (state, props) => {
  const reduxKey = get(props, 'reduxKey', 'journals');
  const stateId = get(props, 'stateId', '');
  const toolsKey = get(props, 'toolsKey', 'inlineToolSettings');
  const newState = state[reduxKey][stateId] || {};

  return {
    className: props.className,
    inlineToolSettings: newState[toolsKey],
    selectedRecords: newState.selectedRecords || [],
    selectAllPageRecords: newState.selectAllPageRecords
  };
};

export default connect(mapStateToProps)(InlineTools);
