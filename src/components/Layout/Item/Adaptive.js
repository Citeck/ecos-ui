import React from 'react';
import classNames from 'classnames';

import Columns from './Columns';

class Adaptive extends Columns {
  #order = 0;

  renderColumns() {
    const {
      config: { columns }
    } = this.props;

    if (!columns) {
      return null;
    }

    this.#order = 0;

    return <div className="ecos-layout__item-template-columns">{columns.map(this.renderColumn)}</div>;
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

    this.#order += 1;

    return (
      <div
        key={this.#order}
        className="ecos-layout__item-template-column"
        style={{
          flexBasis: params.width,
          minWidth: params.width,
          width: params.width
        }}
      >
        <div className="ecos-layout__item-template-column-element" />
        <div className="ecos-layout__item-template-column-element" />
        <div className="ecos-layout__item-template-column-element" />
      </div>
    );
  };

  render() {
    const { className, active, onClick } = this.props;

    return (
      <div
        className={classNames('ecos-layout__item ecos-layout__item_adaptive', className, {
          'ecos-layout__item_active': active
        })}
      >
        <div className="ecos-layout__item-template" onClick={onClick}>
          {this.renderColumns()}
          <div className="ecos-layout__item-template-arrow" />
        </div>
      </div>
    );
  }
}

export default Adaptive;
