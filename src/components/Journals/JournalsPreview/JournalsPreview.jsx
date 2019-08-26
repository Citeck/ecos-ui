import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import DocPreview from '../../DocPreview/DocPreview';
import '../../DocPreview/style.scss';
import './JournalsPreview.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    previewUrl: newState.previewUrl,
    previewFileName: newState.previewFileName
  };
};

class JournalsPreview extends Component {
  render() {
    const { previewUrl, previewFileName } = this.props;
    let link = previewUrl ? `${previewUrl}` : '';

    link = link.split('|');

    return (
      <div className={classNames('ecos-journals-preview', this.props.className)}>
        <div className={'ecos-journals-preview__container'}>
          <DocPreview fileName={previewFileName || link[1] || ''} link={link[0] || ''} height={'100%'} scale={1} byLink />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsPreview);
