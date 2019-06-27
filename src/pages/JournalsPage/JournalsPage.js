import React from 'react';
import connect from 'react-redux/es/connect/connect';
import { Journals } from '../../components/Journals';
import { JournalsUrlManager } from '../../components/Journals';
import { getId } from '../../helpers/util';
import { initState } from '../../actions/journals';

const mapDispatchToProps = dispatch => ({
  initState: stateId => dispatch(initState(stateId))
});

const STATE_ID = getId();

class JournalsPage extends React.Component {
  constructor(props) {
    super(props);
    this.props.initState(STATE_ID);
  }

  render() {
    return (
      <JournalsUrlManager stateId={STATE_ID}>
        <Journals stateId={STATE_ID} />
      </JournalsUrlManager>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsPage);
