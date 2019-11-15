import React, { Component } from 'react';
import classNames from 'classnames';
import fscreen from 'fscreen';
import { get } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';
import { DefineHeight } from '../common';

export default function getViewer(WrappedComponent, ctrClass = '', isPdf) {
  let _viewer = `${ctrClass}__viewer`;

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
      })
    };

    static defaultProps = {
      isLoading: false,
      resizable: false,
      scrollPage: () => null,
      settings: {}
    };

    constructor(props) {
      super(props);

      this.state = {
        scrollPage: 1
      };
      this.refViewer = React.createRef();
      this.fullScreenOff = true;
    }

    componentDidMount() {
      if (isPdf && this.elViewer.addEventListener) {
        this.elViewer.addEventListener('fullscreenchange', this.onFullscreenchange, false);
      }
    }

    componentWillReceiveProps(nextProps) {
      let oldSet = this.props.settings;
      let { isLoading } = this.props;
      let { currentPage, isFullscreen } = nextProps.settings;

      if (isPdf) {
        if (this.elScrollbar && !isLoading && currentPage !== oldSet.currentPage) {
          let children = this.childrenScroll;
          let childrenLen = children.length;

          currentPage = currentPage > 0 && currentPage <= childrenLen ? currentPage : 1;

          let scrollPage = get(children, `${[currentPage - 1]}.offsetTop`, 0) + 12;

          this.elScrollbar.scrollTop(scrollPage);
          this.setState({ scrollPage: currentPage });
        }

        if (!!isFullscreen !== !!oldSet.isFullscreen) {
          if (isFullscreen) {
            fscreen.requestFullscreen(this.elViewer);
          }
        }
      }
    }

    componentWillUnmount() {
      document.removeEventListener('fullscreenchange', this.onFullscreenchange, false);
    }

    get elScrollbar() {
      const { refScrollbar } = this.refs;

      return refScrollbar;
    }

    get elViewer() {
      return this.refViewer.current || {};
    }

    get childrenScroll() {
      if (this.elScrollbar) {
        return this.elScrollbar.view.children || [];
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

    onScrollFrame = e => {
      if (isPdf) {
        let children = this.childrenScroll;
        let coords = Array.from(children).map(el => get(el, 'offsetTop', 0));
        let found = coords.reverse().find(val => get(e, 'scrollTop', 0) + get(children, '[0].offsetHeight', 0) / 5 >= val);
        let foundIdx = coords.reverse().findIndex(val => found === val);
        let scrollPage = foundIdx + 1;

        this.setState({ scrollPage });
        this.props.scrollPage(scrollPage);
      }
    };

    onFullscreenchange = () => {
      this.fullScreenOff = !this.fullScreenOff;

      if (this.fullScreenOff) {
        this.props.onFullscreen(false);
      }
    };

    renderDocument() {
      let {
        settings: { isFullscreen },
        getContentHeight,
        resizable
      } = this.props;
      let _doc = `${_viewer}-doc`;
      let _fullscreen = `${_viewer}_fullscreen`;
      let _scroll_area = `${_doc}-scroll-area`;
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };

      const renderView = props => <div {...props} className={classNames(_scroll_area)} />;

      if (this.failed) {
        return null;
      }

      return (
        <Scrollbars
          className={classNames({ [_fullscreen]: isFullscreen && isPdf })}
          renderView={renderView}
          ref="refScrollbar"
          onScroll={this.onScroll}
          onScrollFrame={this.onScrollFrame}
          autoHide
        >
          <DefineHeight
            className={classNames({
              'ecos-doc-preview__viewer-define': resizable
            })}
            getContentHeight={getContentHeight}
          >
            <WrappedComponent {...newProps} />
          </DefineHeight>
        </Scrollbars>
      );
    }

    render() {
      return this.failed ? null : (
        <div className={classNames(_viewer)} ref={this.refViewer}>
          {this.renderDocument()}
        </div>
      );
    }
  };
}
