import React from 'react';
import connect from 'react-redux/es/connect/connect';
import { Journals } from '../../components/Journals';
import { JournalsUrlManager } from '../../components/Journals';
import { getId } from '../../helpers/util';
import { initState } from '../../actions/journals';

const mapDispatchToProps = dispatch => ({
  initState: stateId => dispatch(initState(stateId))
});

class JournalsPage extends React.Component {
  constructor(props) {
    super(props);
    this.stateId = getId();
    this.props.initState(this.stateId);
  }

  render() {
    return (
      <JournalsUrlManager stateId={this.stateId}>
        <Journals stateId={this.stateId} />
      </JournalsUrlManager>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsPage);
