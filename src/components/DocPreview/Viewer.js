import React, { Component } from 'react';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import { Scrollbars } from 'react-custom-scrollbars';

export default function getViewer(WrappedComponent, ctrClass = '') {
  let _viewer = `${ctrClass}__viewer`;

  return class extends Component {
    constructor(props) {
      super(props);

      //todo maybe don't need
      this.refScrollbar = React.createRef();
      this.refViewer = React.createRef();
    }

    get checkMsgDoc() {
      let { pdf, urlImg } = this.props;

      if (pdf === undefined && urlImg === undefined) {
        return t('Не указан документ для просмтора');
      } else if (pdf && !pdf._pdfInfo) {
        return t('Возникла проблема при загрузке документа. Попробуйте скачать документ');
      }

      return false;
    }

    render() {
      let _doc = `${_viewer}__doc`;
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };
      let warnMsg = this.checkMsgDoc;
      const renderView = props => <div {...props} className={classNames(`${_doc}__scroll-area`)} />;

      return (
        <div className={_viewer} ref={this.refViewer}>
          {!warnMsg ? (
            <Scrollbars className={classNames()} style={{ height: 500 }} renderView={renderView} ref={this.refScrollbar}>
              <WrappedComponent {...newProps} />
            </Scrollbars>
          ) : (
            <div className={classNames(`${_viewer}__msg ${_viewer}__msg_error`)}>{warnMsg}</div>
          )}
        </div>
      );
    }
  };
}
