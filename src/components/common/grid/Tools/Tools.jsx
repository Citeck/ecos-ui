import React, { Component } from 'react';
import { Btn } from '../../btns';
import { t, trigger } from '../../../../helpers/util';

import './Tools.scss';

export default class Tools extends Component {
  createToolsActions = () => {
    return this.props.tools.map((action, idx) => (
      <div key={idx} className={`grid-tools__item`}>
        {React.cloneElement(action)}
      </div>
    ));
  };

  selectAll = () => {
    trigger.call(this, 'onSelectAll');
  };

  render() {
    const { selectAllVisible, selectAll, total } = this.props;

    return (
      <div className={'grid-tools'}>
        {selectAllVisible ? (
          <div className={'grid-tools__item grid-tools__item_select-all-btn'}>
            <Btn
              className={`ecos-btn_extra-narrow ${selectAll ? 'ecos-btn_blue' : 'ecos-btn_grey5'} ecos-btn_hover_light-blue2`}
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
