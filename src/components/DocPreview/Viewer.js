import React, { Component } from 'react';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';

export default function getViewer(WrappedComponent, ctrClass = '', isPdf) {
  let _viewer = `${ctrClass}__viewer`;

  return class extends Component {
    static propTypes = {
      pdf: PropTypes.object,
      urlImg: PropTypes.string,
      isLoading: PropTypes.bool,
      height: PropTypes.number,
      scrollPage: PropTypes.func
    };

    static defaultProps = {
      scrollPage: () => {}
    };

    constructor(props) {
      super(props);
      this.state = {
        scrollPage: 1
      };
      this.refViewer = React.createRef();
    }

    componentWillReceiveProps(nextProps) {
      if (isPdf) {
        let { isLoading } = this.props;
        let { currentPage } = nextProps.settings;

        if (this.elScrollbar && !isLoading && currentPage !== this.props.settings.currentPage) {
          let children = this.childrenScroll;
          let childrenLen = children.length;

          currentPage = currentPage > 0 && currentPage <= childrenLen ? currentPage : 1;

          let scrollPage = children[currentPage - 1].offsetTop - 10;

          this.elScrollbar.scrollTop(scrollPage);
          this.setState({ scrollPage: currentPage });
        }
      }
    }

    get elScrollbar() {
      const { refScrollbar } = this.refs;

      return refScrollbar;
    }

    get childrenScroll() {
      if (this.elScrollbar) {
        return this.elScrollbar.view.children || [];
      }

      return [];
    }

    get checkDoc() {
      let { pdf, urlImg, isLoading } = this.props;

      if (pdf === undefined && urlImg === undefined) {
        return { type: 'error', msg: t('Не указан документ для просмтора') };
      }

      if (isLoading) {
        return { type: 'info', msg: t('Идет загрузка...') };
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

    render() {
      let { height } = this.props;
      let _doc = `${_viewer}__doc`;
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };
      let checkDoc = this.checkDoc;
      const renderView = props => <div {...props} className={classNames(`${_doc}__scroll-area`)} />;

      return (
        <div className={_viewer} ref={this.refViewer}>
          {!checkDoc ? (
            <Scrollbars
              className={classNames()}
              style={{ height }}
              renderView={renderView}
              ref="refScrollbar"
              onScroll={this.onScroll}
              onScrollFrame={this.onScrollFrame}
            >
              <WrappedComponent {...newProps} />
            </Scrollbars>
          ) : (
            <div style={{ height }} className={classNames(`${_viewer}__msg ${_viewer}__msg_${checkDoc.type}`)}>
              {checkDoc.msg}
            </div>
          )}
        </div>
      );
    }
  };
}
