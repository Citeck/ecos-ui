import React from 'react';
import get from 'lodash/get';

import Base from './Base';

import '../style.scss';

export default class Columns extends Base {
  static defaultProps = {
    ...Base.defaultProps,
    config: {
      columns: [{}, { width: '25%' }]
    },
    type: ''
  };

  _templateRef = React.createRef();
  _order = 0;

  componentDidMount() {
    this.checkTemplateStyle();
  }

  componentDidUpdate() {
    this.checkTemplateStyle();
  }

  checkTemplateStyle() {
    const {
      config: { columns }
    } = this.props;

    if (this._templateRef.current && Array.isArray(get(columns, '0', null))) {
      this._templateRef.current.style.flexDirection = 'column';
      this._templateRef.current.style.fontSize = `calc(24px - (2px * ${columns.length}))`;
      this._templateRef.current.dataset.countRows = columns.length;
    }
  }

  renderColumn = (params, columnNumber) => {
    if (Array.isArray(params)) {
      this.checkTemplateStyle();

      return (
        <div key={columnNumber} className="ecos-layout__item-template-row">
          {params.map(this.renderColumn)}
        </div>
      );
    }

    this._order += 1;

    return (
      <div
        key={this._order}
        className="ecos-layout__item-template-column"
        style={{
          flexBasis: params.width,
          minWidth: params.width,
          width: params.width
        }}
        data-order={this._order}
      />
    );
  };

  renderColumns() {
    const {
      config: { columns }
    } = this.props;

    if (!columns) {
      return null;
    }

    this._order = 0;

    return columns.map(this.renderColumn);
  }

  render() {
    const { onClick } = this.props;

    return (
      <div className={this.className} id={this.id}>
        <div className="ecos-layout__item-template" onClick={onClick} ref={this._templateRef}>
          {this.renderColumns()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
