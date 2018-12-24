import React from 'react';
import { connect } from 'react-redux';
import { initRequest } from '../../actions/bpmn';
import BPMNDesigner from '../../components/BPMNDesigner';

const mapDispatchToProps = dispatch => ({
  initRequest: () => dispatch(initRequest())
});

class BPMNDesignerPage extends React.Component {
  componentDidMount() {
    this.props.initRequest();
  }

  render() {
    return <BPMNDesigner {...this.props} />;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(BPMNDesignerPage);
