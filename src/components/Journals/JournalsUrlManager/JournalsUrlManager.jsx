import React, { Component } from 'react';
import UrlManager from '../../UrlManager';
import connect from 'react-redux/es/connect/connect';
import { setUrl } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setUrl: params => dispatch(setUrl(w(params)))
  };
};

class JournalsUrlManager extends Component {
  setUrl = params => {
    this.props.setUrl(params);
  };

  render() {
    const { params, children } = this.props;
    return (
      <UrlManager params={params} onParse={this.setUrl}>
        {children}
      </UrlManager>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsUrlManager);
