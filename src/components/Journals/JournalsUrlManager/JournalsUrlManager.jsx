import React, { Component, Fragment } from 'react';
import UrlManager from '../../UrlManager';
import connect from 'react-redux/es/connect/connect';
import { setUrl } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import Loader from '../../common/Loader/Loader';

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setUrl: params => dispatch(setUrl(w(params)))
  };
};

class JournalsUrlManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showLoader: Boolean(props.withLoader)
    };
  }

  setUrl = params => {
    this.props.setUrl(params);
  };

  onChildrenRender = () => {
    if (this.state.showLoader) {
      this.setState({ showLoader: false });
    }
  };

  render() {
    const { params, children } = this.props;
    return (
      <Fragment>
        {this.state.showLoader ? <Loader blur height={100} width={100} /> : null}

        <UrlManager params={params} onParse={this.setUrl} onChildrenRender={this.onChildrenRender}>
          {children}
        </UrlManager>
      </Fragment>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsUrlManager);
