import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { InfoText, Loader } from '../../common';
import Checkbox from '../../common/form/Checkbox';

import { Labels } from './util';

import { DOC_PREVIEW_TEXT_MAX_BYTES } from '@/constants';
import { t } from '@/helpers/util';

const BASE_FONT_SIZE_PX = 13;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: false });

function scaleToFontSize(scale) {
  const numeric = parseFloat(scale);
  if (Number.isNaN(numeric)) {
    return BASE_FONT_SIZE_PX;
  }
  return Math.round(BASE_FONT_SIZE_PX * numeric);
}

function truncateByBytes(text, maxBytes) {
  const bytes = textEncoder.encode(text);
  if (bytes.length <= maxBytes) {
    return { content: text, isTruncated: false };
  }
  // TextDecoder with fatal=false may leave a trailing U+FFFD for a partial multibyte sequence
  const decoded = textDecoder.decode(bytes.subarray(0, maxBytes));
  const content = decoded.endsWith('\uFFFD') ? decoded.slice(0, -1) : decoded;
  return { content, isTruncated: true };
}

class TextViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    downloadData: PropTypes.shape({
      link: PropTypes.string,
      fileName: PropTypes.string
    }),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onError: PropTypes.func,
    onCentered: PropTypes.func
  };

  static defaultProps = {
    settings: { scale: 1 }
  };

  state = {
    content: '',
    isTruncated: false,
    isLoading: true,
    error: null,
    wrap: true
  };

  componentDidMount() {
    this.exist = true;
    this.loadContent(this.props.src);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.loadContent(this.props.src);
    }
  }

  componentWillUnmount() {
    this.exist = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  loadContent = async src => {
    if (!src) {
      return;
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    const controller = new AbortController();
    this.abortController = controller;

    this.setState({ isLoading: true, error: null });

    try {
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      // Guard against stale response: a cached/fast fetch can resolve before abort propagates.
      if (controller.signal.aborted || !this.exist) {
        return;
      }

      const { content, isTruncated } = truncateByBytes(text, DOC_PREVIEW_TEXT_MAX_BYTES);

      this.setState({ content, isTruncated, isLoading: false }, () => {
        isFunction(this.props.onCentered) && this.props.onCentered();
      });
    } catch (error) {
      if (error.name === 'AbortError' || !this.exist) {
        return;
      }
      this.setState({ error, isLoading: false });
      isFunction(this.props.onError) && this.props.onError(error);
    }
  };

  handleToggleWrap = ({ checked }) => {
    this.setState({ wrap: checked });
  };

  render() {
    const { settings, downloadData } = this.props;
    const { content, isTruncated, isLoading, error, wrap } = this.state;

    if (isLoading) {
      return <Loader blur />;
    }

    if (error) {
      return (
        <div className="ecos-doc-preview__info-block">
          <InfoText className="ecos-doc-preview__info-block-msg" text={t(Labels.TEXT_LOAD_ERROR)} />
        </div>
      );
    }

    const fontSize = scaleToFontSize(settings.scale);
    const hasDownload = downloadData && downloadData.link;

    return (
      <div className={classNames('ecos-doc-preview__viewer-page', 'ecos-doc-preview__viewer-page_text')}>
        <div className="ecos-doc-preview__viewer-page_text-actions">
          {isTruncated && (
            <div className="ecos-doc-preview__viewer-page_text-truncated-banner">
              <span className="ecos-doc-preview__viewer-page_text-truncated-banner-text">{t(Labels.TEXT_TRUNCATED)}</span>
              {hasDownload && (
                <a
                  className="ecos-doc-preview__viewer-page_text-truncated-banner-link"
                  href={downloadData.link}
                  download={downloadData.fileName}
                  data-external
                >
                  {t(Labels.DOWNLOAD)}
                </a>
              )}
            </div>
          )}
          <Checkbox
            className="ecos-doc-preview__viewer-page_text-wrap-toggle ecos-checkbox_flex"
            checked={wrap}
            onChange={this.handleToggleWrap}
            title={t(wrap ? Labels.TEXT_WRAP_OFF : Labels.TEXT_WRAP_ON)}
          >
            {t(Labels.TEXT_WRAP_LABEL)}
          </Checkbox>
        </div>
        <pre
          className={classNames('ecos-doc-preview__viewer-page-content', 'ecos-doc-preview__viewer-page-content_text', {
            'ecos-doc-preview__viewer-page-content_text-wrap': wrap,
            'ecos-doc-preview__viewer-page-content_text-nowrap': !wrap
          })}
          style={{ fontSize }}
        >
          {content}
        </pre>
      </div>
    );
  }
}

export default TextViewer;
