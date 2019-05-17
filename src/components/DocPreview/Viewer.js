import React, { Component } from 'react';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';

export default function getViewer(WrappedComponent, ctrClass = '') {
  let _viewer = `${ctrClass}__viewer`;

  return class extends Component {
    static propTypes = {
      pdf: PropTypes.object,
      urlImg: PropTypes.string,
      isLoading: PropTypes.bool,
      height: PropTypes.number
    };

    static defaultProps = {};

    constructor(props) {
      super(props);

      this.refViewer = React.createRef();
    }

    componentWillReceiveProps(nextProps) {
      let { isLoading } = this.props;
      let { currentPage } = nextProps.settings;

      if (this.elScrollbar && !isLoading && currentPage !== this.props.settings.currentPage) {
        let children = this.elScrollbar.view.children;
        let childrenLen = children.length;

        currentPage = currentPage > 0 && currentPage <= childrenLen ? currentPage : 1;

        let scrollPage = this.elScrollbar.view.children[currentPage - 1].offsetTop - 10;

        this.elScrollbar.scrollTop(scrollPage);
      }
    }

    get elScrollbar() {
      const { refScrollbar } = this.refs;

      return refScrollbar;
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

    onScroll = e => {
      console.log(e);
    };

    onScrollFrame = e => {
      console.log(e);
    };

    render() {
      let _doc = `${_viewer}__doc`;
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };
      let checkDoc = this.checkDoc;
      let { height } = this.props;
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
