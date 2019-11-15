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
  _order = 0;

  componentDidMount() {
    this.checkStyle();
  }

  componentDidUpdate() {
    this.checkStyle();
  }

  checkStyle() {
    const {
      config: { columns }
    } = this.props;

    if (this._templateRef.current && Array.isArray(columns[0])) {
      this._templateRef.current.style.flexDirection = 'column';
      this._templateRef.current.style.fontSize = `calc(24px - (2px * ${columns.length}))`;
      this._templateRef.current.dataset.countRows = columns.length;
    }
  }

  renderColumn = (params, index = 0) => {
    if (Array.isArray(params)) {
      this.checkStyle();

      return <div className="ecos-layout__item-template-row">{params.map(this.renderColumn)}</div>;
    }

    this._order += 1;

    return (
      <div
        key={index}
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
      <div className={this.className}>
        <div className="ecos-layout__item-template" onClick={onClick} ref={this._templateRef}>
          {this.renderColumns()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
