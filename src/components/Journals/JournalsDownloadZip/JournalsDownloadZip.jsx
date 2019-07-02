import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import DownloadZip from '../../DownloadZip/DownloadZip';
import { createZip } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import { getZipUrl } from '../../../helpers/urls';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    zipNodeRef: newState.zipNodeRef
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    createZip: selected => dispatch(createZip(w(selected)))
  };
};

class JournalsDownloadZip extends Component {
  createZip = () => {
    const { selected, createZip } = this.props;
    createZip(selected);
  };

  render() {
    const { zipNodeRef } = this.props;

    return <DownloadZip onClick={this.createZip} url={zipNodeRef ? getZipUrl(zipNodeRef) : ''} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDownloadZip);
