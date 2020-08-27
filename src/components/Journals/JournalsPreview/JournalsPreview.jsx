import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import get from 'lodash/get';

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
    clear: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const clear = prevProps.journalId !== this.props.journalId;

    if (clear !== this.state.clear) {
      this.setState({ clear });
    }
  }

  render() {
    const { recordId, className } = this.props;
    const { clear } = this.state;

    return (
      <div className={classNames('ecos-journals-preview', className)}>
        <div className="ecos-journals-preview__container">
          <DocPreview height={'100%'} scale={'auto'} recordId={recordId} clear={clear} />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsPreview);
