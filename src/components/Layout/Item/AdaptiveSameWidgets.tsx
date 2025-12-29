import React from 'react';

import Adaptive from './Adaptive';

const Labels = {
  TOOLTIP: 'dashboard-settings.layout.tooltip.adaptive-same-widgets'
};

class AdaptiveSameWidgets extends Adaptive {
  static defaultProps = {
    ...Adaptive.defaultProps,
    tooltip: Labels.TOOLTIP
  };

  #order = 0;

  renderColumns() {
    const {
      config: { columns }
    } = this.props;

    if (!columns) {
      return null;
    }

    this.#order = 0;

    return <div className="ecos-layout__item-template-columns">{[{}, {}, {}].map(this.renderColumn)}</div>;
  }
}

export default AdaptiveSameWidgets;
