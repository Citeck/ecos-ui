import * as React from 'react';
import PropTypes from 'prop-types';
import TaskDetails from './TaskDetails';
import { getDashletConfig } from '../../actions/tasks';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  theme: state.view.theme
});

const mapDispatchToProps = dispatch => ({
  setPageArgs: pageArgs => dispatch(setPageArgs(pageArgs)),
  fetchNodeInfo: nodeRef => dispatch(fetchNodeInfo(nodeRef)),
  fetchCardlets: nodeRef => dispatch(fetchCardlets(nodeRef)),
  fetchStartMessage: nodeRef => dispatch(fetchStartMessage(nodeRef)),
  setCardMode: (cardMode, registerReducers) => dispatch(setCardMode(cardMode, registerReducers))
});

class Tasks extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    id: PropTypes.string.isRequired
  };

  static defaultProps = {
    className: '',
    height: 'inherit',
    scale: 0.5,
    isLoading: false,
    errMsg: ''
  };

  render() {
    const { tasks } = this.props;

    return (
      <React.Fragment>
        {tasks.map((item, i) => (
          <TaskDetails details={item} key={i} />
        ))}
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
