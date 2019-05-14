import React, { Component } from 'react';
import classNames from 'classnames';
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

    render() {
      let _doc = `${_viewer}__doc`;
      let newProps = { ...this.props, ctrClass: _doc, refViewer: this.refViewer };
      const renderView = props => <div {...props} className={classNames(`${_doc}__scroll-area`)} />;

      return (
        <div className={_viewer} ref={this.refViewer}>
          <Scrollbars className={classNames()} style={{ height: 500 }} renderView={renderView} ref={this.refScrollbar}>
            <WrappedComponent {...newProps} />
          </Scrollbars>
          {/*<div className={classNames(`${_viewer}__msg ${_viewer}__msg_error`)}>{t('Нет документа для отображения')}</div>*/}
        </div>
      );
    }
  };
}
