import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import fscreen from 'fscreen';
import get from 'lodash/get';
import set from 'lodash/set';
import { Scrollbars } from 'react-custom-scrollbars';

import { DefineHeight, Fullpage, Icon } from '../../common';

const $PAGE = '.ecos-doc-preview__viewer-page';
const fullscreenEnabled = fscreen.fullscreenEnabled;

export default function getViewer(WrappedComponent, isPdf) {
  return class extends Component {
    static propTypes = {
      pdf: PropTypes.object,
      src: PropTypes.string,
      isLoading: PropTypes.bool,
      resizable: PropTypes.bool,
      scrollPage: PropTypes.func,
      settings: PropTypes.shape({
        scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        isFullscreen: PropTypes.bool,
        currentPage: PropTypes.number
      }),
      forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
    };

    static defaultProps = {
      settings: {}
    };

    state = {
      isFullscreenOn: false,
      scrollPage: 1
    };

    constructor(props) {
      super(props);

      this.refViewer = React.createRef();
    }

    componentDidMount() {
      if (fullscreenEnabled) {
        document.addEventListener('fullscreenchange', this.onChangeFullscreen, false);
      }
    }

    getSnapshotBeforeUpdate(prevProps) {
      let snapshot = null;

      const { currentPage: prevCurrentPage, isFullscreen: prevIsFullscreen } = prevProps.settings || {};
      const { currentPage, isFullscreen, isLoading } = this.props.settings || {};

      if (!!prevIsFullscreen !== !!isFullscreen) {
        snapshot = { ...snapshot };
        snapshot.openFullscreen = isFullscreen;
      }

      if (isPdf) {
        if (!isLoading && this.elScrollbar && currentPage !== prevCurrentPage) {
          const children = this.childrenScroll;
          const childrenLen = children.length;

          snapshot = { ...snapshot };
          snapshot.page = currentPage > 0 && currentPage <= childrenLen ? currentPage : 1;
        }
      }

      return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      const { scrollPage } = this.state;

      if (snapshot !== null) {
        if (snapshot.openFullscreen) {
          this.onOpenFullscreen();
        }

        if (snapshot.page !== null && snapshot.page !== scrollPage) {
          const children = this.childrenScroll;
          const scrollTo = get(children, [snapshot.page - 1, 'offsetTop'], 0);
          set(this.elScrollbar, 'view.scrollTop', scrollTo);
        }
      }
    }

    componentWillUnmount() {
      document.removeEventListener('fullscreenchange', this.onChangeFullscreen, false);
    }

    get elScrollbar() {
      const { refScrollbar } = this.refs;

      return refScrollbar;
    }

    get elViewer() {
      return this.refViewer.current || {};
    }

    get childrenScroll() {
      if (this.elScrollbar && this.elScrollbar.view) {
        return this.elScrollbar.view.querySelectorAll($PAGE);
      }

      return [];
    }

    get failed() {
      const { pdf, src, isLoading } = this.props;

      if (isLoading) {
        return true;
      }

      if (pdf === undefined && !src) {
        return true;
      }

      if (pdf && Object.keys(pdf).length && !pdf._pdfInfo) {
        return true;
      }

      return false;
    }

    prevScroll = 0;
    onScrollFrame = data => {
      if (isPdf) {
        const { scrollPage } = this.state;
        const { scrollTop } = data;
        const children = this.childrenScroll;
        const isDown = this.prevScroll - scrollTop <= 0;
        this.prevScroll = scrollTop;

        const coords = Array.from(children).map(child => {
          const top = get(child, 'offsetTop', 0);
          const h = get(child, 'offsetHeight', 0);
          return { top, h, bottom: top + h };
        });

        const foundIdx = coords.findIndex((val, i) => {
          const scroll = scrollTop + ((isDown ? 1 : -1) * val.h) / 4;
          return isDown ? scroll < val.bottom : scroll < val.top;
        });

        const newPage = foundIdx === -1 ? 1 : foundIdx + 1;

        if (scrollPage !== newPage) {
          this.setState({ scrollPage: newPage });
          this.props.scrollPage && this.props.scrollPage(newPage);
        }
      }
    };

    onOpenFullscreen = () => {
      if (fullscreenEnabled) {
        fscreen.requestFullscreen(this.elViewer);
      } else {
        this.onChangeFullscreen();
      }
    };

    onCloseFullscreen = () => {
      if (fullscreenEnabled) {
        fscreen.exitFullscreen();
      } else {
        this.onChangeFullscreen();
      }
    };

    onChangeFullscreen = () => {
      this.setState({ isFullscreenOn: !this.state.isFullscreenOn });
    };

    renderBtnCloseFullscreen() {
      return (
        <div className="ecos-doc-preview__btn-close-fullscreen" onClick={this.onCloseFullscreen}>
          <Icon className="icon-small-close" />
        </div>
      );
    }

    renderDocument() {
      const { getContentHeight, resizable } = this.props;
      const newProps = { ...this.props, refViewer: this.refViewer };
      const { isFullscreenOn } = this.state;
      const renderView = props => <div {...props} className="ecos-doc-preview__viewer-scroll-area" />;

      if (this.failed) {
        return null;
      }

      return (
        <Scrollbars
          className={classNames({ 'ecos-doc-preview__viewer_fullscreen': isFullscreenOn && isPdf })}
          renderView={renderView}
          ref="refScrollbar"
          onScroll={this.onScroll}
          onScrollFrame={this.onScrollFrame}
          autoHide
        >
          <DefineHeight
            className={classNames({ 'ecos-doc-preview__viewer-dh': resizable || isFullscreenOn })}
            getContentHeight={getContentHeight}
            querySelector={isPdf ? undefined : $PAGE}
          >
            <WrappedComponent {...newProps} />
          </DefineHeight>
        </Scrollbars>
      );
    }

    render() {
      const { isFullscreenOn } = this.state;

      return this.failed ? null : (
        <div className="ecos-doc-preview__viewer" ref={this.refViewer}>
          {this.renderDocument()}
          {fullscreenEnabled && isFullscreenOn && this.renderBtnCloseFullscreen()}
          {!fullscreenEnabled && isFullscreenOn && <Fullpage onClose={this.onCloseFullscreen}>{this.renderDocument()}</Fullpage>}
        </div>
      );
    }
  };
}
