import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { InfoText } from '@/components/common';

import { Labels } from './util';

import { t } from '@/helpers/util';

/**
 * Plays a video the browser can decode by itself.
 *
 * `download=false` is not asked for: a browser ignores `Content-Disposition` for the source of a
 * media element, so the url that offers the file for saving elsewhere plays here unchanged.
 *
 * Seeking costs whatever the backend makes it cost. Against a backend that answers a range request
 * the player fetches the part it is about to play; against one that does not, the clip still plays
 * and seeks only over what has been buffered - worse, but not broken, and nothing here has to know
 * which of the two it is talking to.
 */
class VideoViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
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
    // the element gives no exception to pass on, only the fact that it cannot play this
    const error = new Error(`Video can't be played: ${this.props.src}`);

    this.setState({ error });
    isFunction(this.props.onError) && this.props.onError(error);
  };

  handleLoadedMetadata = () => {
    isFunction(this.props.onCentered) && this.props.onCentered();
  };

  render() {
    const { src, downloadData, forwardedRef } = this.props;
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

    return (
      <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_media" ref={forwardedRef}>
        {/* metadata only: a preview should not start pulling a video nobody has asked to play */}
        <video
          className="ecos-doc-preview__viewer-page-content ecos-doc-preview__viewer-page-content_video"
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

export default VideoViewer;
