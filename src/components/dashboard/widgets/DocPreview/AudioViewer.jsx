import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { InfoText } from '@/components/common';
import FileIcon from '@/components/common/FileIcon';

import { Labels } from './util';

import { t } from '@/helpers/util';

/**
 * Plays an audio file the browser can decode by itself.
 *
 * An audio element on its own is a bar floating in an empty page with nothing to say what is
 * playing, so the name and the format icon are shown next to it. See {@link VideoViewer} for why no
 * disposition is asked for and what seeking costs.
 */
class AudioViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    ext: PropTypes.string,
    fileName: PropTypes.string,
    downloadData: PropTypes.shape({
      link: PropTypes.string,
      fileName: PropTypes.string
    }),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onError: PropTypes.func,
    onCentered: PropTypes.func
  };

  state = { error: null };

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleError = () => {
    const error = new Error(`Audio can't be played: ${this.props.src}`);

    this.setState({ error });
    isFunction(this.props.onError) && this.props.onError(error);
  };

  handleLoadedMetadata = () => {
    isFunction(this.props.onCentered) && this.props.onCentered();
  };

  render() {
    const { src, ext, fileName, downloadData, forwardedRef } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <div className="ecos-doc-preview__info-block">
          <InfoText className="ecos-doc-preview__info-block-msg" text={t(Labels.Errors.MEDIA_FAILURE)} />
          {downloadData && downloadData.link && (
            <a href={downloadData.link} download={downloadData.fileName} data-external>
              {t(Labels.DOWNLOAD)}
            </a>
          )}
        </div>
      );
    }

    const name = fileName || (downloadData && downloadData.fileName) || '';

    return (
      <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_media" ref={forwardedRef}>
        <div className="ecos-doc-preview__viewer-page_media-title">
          <FileIcon format={ext} />
          <span className="ecos-doc-preview__viewer-page_media-title-name">{name}</span>
        </div>
        <audio
          className="ecos-doc-preview__viewer-page-content ecos-doc-preview__viewer-page-content_audio"
          src={src}
          controls
          preload="metadata"
          onError={this.handleError}
          onLoadedMetadata={this.handleLoadedMetadata}
        />
      </div>
    );
  }
}

export default AudioViewer;
