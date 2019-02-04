import React from 'react';
import { connect } from 'react-redux';
import { initRequest } from '../../actions/journal';
import { Journals } from '../../components/Journals';

const mapDispatchToProps = dispatch => ({
  initRequest: () => dispatch(initRequest())
});

class JournalsPage extends React.Component {
  componentDidMount() {
    this.props.initRequest();
  }

  render() {
    return <Journals {...this.props} />;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsPage);
