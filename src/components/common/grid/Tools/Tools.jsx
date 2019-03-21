import React, { Component } from 'react';
import { Btn } from '../../btns';
import { t } from '../../../../helpers/util';

import './Tools.scss';

function triggerEvent(name, data) {
  const callback = this.props[name];

  if (typeof callback === 'function') {
    callback.call(this, data);
  }
}

export default class Tools extends Component {
  createToolsActions = () => {
    return this.props.tools.map((action, idx) => (
      <div key={idx} className={`grid-tools__item`}>
        {React.cloneElement(action)}
      </div>
    ));
  };

  selectAll = () => {
    triggerEvent.call(this, 'onSelectAll');
  };

  render() {
    const { selectAllVisible, selectAll, total } = this.props;

    return (
      <div className={'grid-tools'}>
        {selectAllVisible ? (
          <div className={'grid-tools__item grid-tools__item_select-all-btn'}>
            <Btn
              className={`btn_extra-narrow ${selectAll ? 'btn_blue' : 'btn_grey5'} btn_hover_light-blue2`}
              title={t('grid.tools.select-all')}
              onClick={this.selectAll}
            >
              {t('grid.tools.select-all')} {total}
            </Btn>
          </div>
        ) : null}

        {this.createToolsActions()}
      </div>
    );
  }
}
