import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';

import { DocPreview } from '../../widgets/DocPreview';

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
    const { previewUrl, previewFileName, className } = this.props;
    const parseUrl = previewUrl ? previewUrl.split('|') : [];
    const [link, fileName] = parseUrl;

    return (
      <div className={classNames('ecos-journals-preview', className)}>
        <div className="ecos-journals-preview__container">
          <DocPreview fileName={previewFileName || fileName} link={link} height={'100%'} scale={1} byLink />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsPreview);
