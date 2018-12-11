import React from 'react';
import { connect } from 'react-redux';
import BPMNDesigner from '../../components/BPMNDesigner';

const mapDispatchToProps = dispatch => ({
  // setPageArgs: pageArgs => dispatch(setPageArgs(pageArgs)),
});

class BPMNDesignerPage extends React.Component {
  componentDidMount() {}

  render() {
    return <BPMNDesigner {...this.props} />;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(BPMNDesignerPage);
