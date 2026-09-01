import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { InfoText, Loader } from '@/components/common';

import { loadTextContent } from './textContent';
import { Labels } from './util';

import { t } from '@/helpers/util';

const BASE_FONT_SIZE_PX = 13;

/**
 * The plugins the source is rendered with, named once so that a test can state what is not among
 * them. `rehype-raw` is the one that matters: without it the html a markdown file may contain is
 * printed rather than run, and that absence is the sanitisation - a preview shows a file somebody
 * uploaded, so the file must not get to execute anything.
 */
export const REMARK_PLUGINS = [remarkGfm];

function scaleToFontSize(scale) {
  const numeric = parseFloat(scale);

  return Number.isNaN(numeric) ? BASE_FONT_SIZE_PX : Math.round(BASE_FONT_SIZE_PX * numeric);
}

/**
 * Renders a markdown file as formatted text.
 *
 * Links are left as plain anchors on purpose: where a link opens is decided globally
 * (`PageTabs.handleClickLink`, COREDEV-433), and a viewer that decided it again would be a second
 * answer to the same question. Relative images are not resolved either - the file has no location
 * the ui knows about, and guessing one would only produce broken pictures.
 */
class MarkdownViewer extends Component {
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
    error: null
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
      const { content, isTruncated } = await loadTextContent(src, { signal: controller.signal });

      // Guard against stale response: a cached/fast fetch can resolve before abort propagates.
      if (controller.signal.aborted || !this.exist) {
        return;
      }

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

  render() {
    const { settings, downloadData } = this.props;
    const { content, isTruncated, isLoading, error } = this.state;

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

    const hasDownload = downloadData && downloadData.link;

    // the same framed page the text viewer uses: a markdown file is a text file that is rendered
    // rather than printed, and the frame, the banner and the download link are the same in both
    return (
      <div className={classNames('ecos-doc-preview__viewer-page', 'ecos-doc-preview__viewer-page_text')}>
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
        <div
          className="ecos-doc-preview__viewer-page-content ecos-doc-preview__viewer-page-content_markdown"
          style={{ fontSize: scaleToFontSize(settings.scale) }}
        >
          <Markdown remarkPlugins={REMARK_PLUGINS}>{content}</Markdown>
        </div>
      </div>
    );
  }
}

export default MarkdownViewer;
