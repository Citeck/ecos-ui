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

  renderColumn = (params, index) => {
    return (
      <div
        key={index}
        className="ecos-layout__item-template-column"
        style={{
          flexBasis: params.width,
          minWidth: params.width
        }}
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
        <div className="ecos-layout__item-template" onClick={onClick}>
          <div className="ecos-layout__item-template-columns-wrapper">{this.renderColumns()}</div>
          {this.renderActiveIcon()}
        </div>

        {this.renderDescription()}
      </div>
    );
  }
}
