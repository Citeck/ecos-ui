import React, { Component } from 'react';
import classNames from 'classnames';
import fscreen from 'fscreen';
import { t } from '../../helpers/util';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';
import Loader from '../common/Loader/Loader';

export default function getViewer(WrappedComponent, ctrClass = '', isPdf) {
  let _viewer = `${ctrClass}__viewer`;

  return class extends Component {
    static propTypes = {
      pdf: PropTypes.object,
      urlImg: PropTypes.string,
      isLoading: PropTypes.bool,
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      scrollPage: PropTypes.func,
      settings: PropTypes.shape({
        scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        isFullscreen: PropTypes.bool,
        currentPage: PropTypes.number
      })
    };

    static defaultProps = {
      scrollPage: () => {},
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
      if (isPdf) {
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

          let scrollPage = children[currentPage - 1].offsetTop + 12;

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

    get checkMessage() {
      let { pdf, urlImg } = this.props;

      if (pdf === undefined && !urlImg) {
        return { type: 'error', msg: t('Не указан документ для просмтора') };
      }

      if (pdf && Object.keys(pdf).length && !pdf._pdfInfo) {
        return { type: 'warn', msg: t('Возникла проблема при загрузке документа. Попробуйте скачать документ') };
      }

      return null;
    }

    onScrollFrame = e => {
      if (isPdf) {
        let children = this.childrenScroll;
        let coords = Array.from(children).map(el => el.offsetTop);
        let found = coords.reverse().find(val => e.scrollTop + children[0].offsetHeight / 5 >= val);
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
        height,
        settings: { isFullscreen }
      } = this.props;
      let _doc = `${_viewer}__doc`;
      let _fullscreen = `${_viewer}_fullscreen`;
      let _scroll_area = `${_doc}__scroll-area`;
      let style = {};
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };
      const renderView = props => <div {...props} className={classNames(_scroll_area)} />;

      if (this.checkMessage) {
        return null;
      }

      if (!isFullscreen && height) {
        style = { ...style, height };
      }

      return (
        <Scrollbars
          className={classNames({ [_fullscreen]: isFullscreen && isPdf })}
          style={style}
          renderView={renderView}
          ref="refScrollbar"
          onScroll={this.onScroll}
          onScrollFrame={this.onScrollFrame}
          autoHide
        >
          <WrappedComponent {...newProps} />
        </Scrollbars>
      );
    }

    renderMessage() {
      let { height } = this.props;
      const message = this.checkMessage;
      let _msg = `${_viewer}__msg`;

      if (!message) {
        return null;
      }

      return (
        <div style={{ height }} className={classNames(_msg, `${_msg}_${message.type}`)}>
          {message.msg}
        </div>
      );
    }

    renderLoader() {
      let { isLoading } = this.props;

      if (!isLoading) {
        return null;
      }

      return (
        <div className={`${_viewer}-loader-wrapper`}>
          <Loader />
        </div>
      );
    }

    render() {
      return (
        <div className={_viewer} ref={this.refViewer}>
          {this.renderDocument()}
          {this.renderMessage()}
          {this.renderLoader()}
        </div>
      );
    }
  };
}
