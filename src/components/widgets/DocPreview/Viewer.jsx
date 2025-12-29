import classNames from 'classnames';
import fscreen from 'fscreen';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import set from 'lodash/set';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { Fullpage, Icon, InfoText } from '../../common';
import { Btn } from '../../common/btns';

import { Labels } from './util';

import { DocScaleOptions } from '@/constants';
import { camelize, t } from '@/helpers/util';
import './style.scss';

const $PAGE = '.ecos-doc-preview__viewer-page';
const fullscreenEnabled = fscreen.fullscreenEnabled;
const bottomPad = getComputedStyle(document.documentElement).getPropertyValue('--bottom-pad').trim();

export default function getViewer(WrappedComponent, isPdf) {
  return class Viewer extends Component {
    static propTypes = {
      pdf: PropTypes.object,
      src: PropTypes.string,
      isLoading: PropTypes.bool,
      resizable: PropTypes.bool,
      settings: PropTypes.shape({
        scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        isFullscreen: PropTypes.bool,
        currentPage: PropTypes.number
      }),
      forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
      onNextDocument: PropTypes.func,
      onScrollPage: PropTypes.func
    };

    state = {
      isFullscreenOn: false,
      isMounted: false,
      scrollPage: 1
    };

    constructor(props) {
      super(props);

      this.refViewer = React.createRef();
      this.refScrollbar = React.createRef();
    }

    componentDidMount() {
      if (fullscreenEnabled) {
        document.addEventListener('fullscreenchange', this.handleChangeFullscreen, false);
      }

      if (!isPdf) {
        this.setScrollDefaultPosition();
      }

      this.setState({ isMounted: true });
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
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
          this.handleOpenFullscreen();
        }

        if (snapshot.page !== null && snapshot.page !== scrollPage) {
          const children = this.childrenScroll;
          const scrollTo = get(children, [snapshot.page - 1, 'offsetTop'], 0);
          set(this.elScrollbar, 'view.scrollTop', scrollTo);
        }
      }

      const scales = [
        DocScaleOptions.AUTO,
        camelize(DocScaleOptions.PAGE_WIDTH),
        camelize(DocScaleOptions.PAGE_FIT),
        camelize(DocScaleOptions.PAGE_HEIGHT)
      ];

      if (
        !isPdf &&
        get(this.props, 'settings.scale') !== get(prevProps, 'settings.scale') &&
        scales.includes(get(this.props, 'settings.selectedZoom'))
      ) {
        this.setScrollDefaultPosition();
      }
    }

    componentWillUnmount() {
      this.setScrollDefaultPosition.cancel();
      document.removeEventListener('fullscreenchange', this.handleChangeFullscreen, false);
    }

    get elScrollbar() {
      return this.refScrollbar?.current;
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

    prevScroll = 0;

    setScrollDefaultPosition = debounce(() => {
      if (!this.elScrollbar) {
        return;
      }

      const { clientWidth, clientHeight, scrollWidth, scrollHeight } = this.elScrollbar.getValues();
      const transitionElement = this.elScrollbar.view.querySelector('.ecos-doc-preview__viewer-doc-transition');
      let offset = isPdf ? 0 : parseInt(bottomPad || 0, 10) / 2;

      if (transitionElement) {
        offset += transitionElement.offsetHeight;
      }

      this.elScrollbar.scrollLeft((scrollWidth - clientWidth) / 2);
      this.elScrollbar.scrollTop((scrollHeight - clientHeight) / 2 - offset);
    }, 250);

    handleAboutToReachBottom = debounce(
      () => {
        if (isFunction(this.props.onNextDocument)) {
          if (this.elScrollbar) {
            const { scrollTop } = this.elScrollbar.getValues();

            if (scrollTop === 0) {
              return;
            }
          }

          this.props.onNextDocument();
        }
      },
      500,
      { maxWait: 1000, trailing: true }
    );

    handleScrollFrame = event => {
      this.handleAboutToReachBottom.cancel();

      const { scrollTop, scrollHeight, clientHeight, top } = event;
      const scrollQuotient = (scrollTop + 10) / (scrollHeight - clientHeight);

      if (scrollQuotient > 1) {
        this.handleAboutToReachBottom();
      }

      if (isPdf) {
        const { scrollPage } = this.state;
        const children = this.childrenScroll;
        const isDown = top === 1;

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
          isFunction(this.props.onScrollPage) && this.props.onScrollPage(newPage);
        }
      }
    };

    handleOpenFullscreen = () => {
      if (fullscreenEnabled) {
        fscreen.requestFullscreen(this.elViewer);
      } else {
        this.handleChangeFullscreen();
      }
    };

    handleCloseFullscreen = () => {
      if (fullscreenEnabled) {
        fscreen.exitFullscreen();
      } else {
        this.handleChangeFullscreen();
      }
    };

    handleChangeFullscreen = () => {
      this.setState({ isFullscreenOn: !this.state.isFullscreenOn });
    };

    renderBtnCloseFullscreen = () => {
      return (
        <div className="ecos-doc-preview__btn-close-fullscreen" onClick={this.handleCloseFullscreen}>
          <Icon className="icon-small-close" />
        </div>
      );
    };

    renderDocument = () => {
      const { scrollbarProps, componentRef, isLoading, onNextDocument } = this.props;
      const newProps = { ...this.props, refViewer: this.refViewer };
      const { isFullscreenOn } = this.state;
      const renderView = props => <div {...props} className="ecos-doc-preview__viewer-scroll-area" />;

      const extraProps = { ...scrollbarProps };

      if (isFullscreenOn) {
        extraProps.style = { ...scrollbarProps.style, height: '100%' };
      }

      const hasDocTransition = !isLoading && !isFullscreenOn && isFunction(onNextDocument);

      if (!this.state.isMounted) {
        return null;
      }

      return (
        <Scrollbars
          className={classNames({ 'ecos-doc-preview__viewer_fullscreen': isFullscreenOn })}
          renderView={renderView}
          ref={this.refScrollbar}
          onScrollFrame={this.handleScrollFrame}
          autoHide
          {...extraProps}
        >
          <div>
            <WrappedComponent {...newProps} ref={componentRef} onCentered={this.setScrollDefaultPosition} />
          </div>
          {hasDocTransition && (
            <div className="ecos-doc-preview__viewer-doc-transition">
              <InfoText text={t(Labels.DOC_TRANSITION_MSG)} />
              <Btn onClick={onNextDocument}>{t(Labels.DOC_TRANSITION_BTN)}</Btn>
            </div>
          )}
        </Scrollbars>
      );
    };

    renderFullscreen = () => {
      const { isFullscreenOn } = this.state;

      return (
        <>
          {fullscreenEnabled && isFullscreenOn && this.renderBtnCloseFullscreen()}
          {!fullscreenEnabled && isFullscreenOn && <Fullpage onClose={this.handleCloseFullscreen}>{this.renderDocument()}</Fullpage>}
        </>
      );
    };

    render() {
      return (
        <div className="ecos-doc-preview__viewer" ref={this.refViewer}>
          {this.renderDocument()}
          {this.renderFullscreen()}
        </div>
      );
    }
  };
}
