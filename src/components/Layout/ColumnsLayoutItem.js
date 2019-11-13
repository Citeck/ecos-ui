import React from 'react';
import BaseLayoutItem from './BaseLayoutItem';
import './style.scss';

export default class ColumnsLayoutItem extends BaseLayoutItem {
  static defaultProps = {
    ...BaseLayoutItem.defaultProps,
    config: {
      columns: [{}, { width: '25%' }]
    }
  };

  _templateRef = React.createRef();

  renderColumn = (params, index = 0, ...other) => {
    console.warn(params, index, other);

    if (Array.isArray(params)) {
      if (this._templateRef.current) {
        this._templateRef.current.style.flexDirection = 'column';
      }
      return <div className="ecos-layout__item-template-row">{params.map((data, i) => this.renderColumn(data, data.length))}</div>;
    }

    return (
      <div
        key={index}
        className="ecos-layout__item-template-column"
        style={{
          flexBasis: params.width,
          minWidth: params.width,
          width: params.width
        }}
        data-order={index}
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

    return columns.map(this.renderColumn);
  }

  render() {
    const { onClick } = this.props;

    return (
      <div className={this.className}>
        <div className="ecos-layout__item-template" onClick={onClick} ref={this._templateRef}>
          {this.renderColumns()}
          {this.renderActiveIcon()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
