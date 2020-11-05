import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setUrl } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import { isExistValue } from '../../../helpers/util';
import { Loader } from '../../common/index';
import UrlManager from '../../UrlManager';
import { URL } from '../../../constants';

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
    const { isActivePage, setUrl } = this.props;

    (!isExistValue(isActivePage) || isActivePage) && setUrl(params);
  };

  onChildrenRender = () => {
    if (this.state.showLoader) {
      this.setState({ showLoader: false });
    }
  };

  render() {
    const { params, children, isActivePage } = this.props;
    const { showLoader } = this.state;

    return (
      <>
        {!!showLoader && <Loader blur height={100} width={100} />}
        <UrlManager
          isActivePage={isActivePage}
          params={params}
          path={URL.JOURNAL}
          onParse={this.setUrl}
          onChildrenRender={this.onChildrenRender}
        >
          {children}
        </UrlManager>
      </>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsUrlManager);
