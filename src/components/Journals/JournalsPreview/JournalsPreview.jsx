import classNames from 'classnames';
import get from 'lodash/get';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { DocPreview } from '../../widgets/DocPreview';

import './JournalsPreview.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    previewUrl: get(newState, 'previewUrl', ''),
    previewFileName: get(newState, 'previewFileName', ''),
    journalId: get(newState, 'journalConfig.id', '')
  };
};

class JournalsPreview extends Component {
  state = {
    isUpdate: false,
    clear: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const isUpdate = prevProps.recordId !== this.props.recordId;

    const clear = prevProps.journalId !== this.props.journalId;

    if (clear !== this.state.clear) {
      this.setState({ clear });
    }

    if (isUpdate !== this.state.isUpdate) {
      this.setState({ isUpdate });
    }
  }

  render() {
    const { recordId, className } = this.props;
    const { clear, isUpdate } = this.state;

    return (
      <div className={classNames('ecos-journals-preview', className)}>
        <div className="ecos-journals-preview__container">
          <DocPreview height={'100%'} scale={'auto'} recordId={recordId} clear={clear} runUpdate={isUpdate} />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsPreview);
