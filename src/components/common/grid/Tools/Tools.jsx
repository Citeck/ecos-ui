import React, { Component } from 'react';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../helpers/util';
import { Btn } from '../../btns';

import './Tools.scss';

export default class Tools extends Component {
  createToolsActions = () => {
    return this.props.tools.map((action, idx) => (
      <div key={idx} className={`grid-tools__item`}>
        {React.cloneElement(action)}
      </div>
    ));
  };

  selectAll = () => this.props.onSelectAll();
  resetAll = () => this.props.onResetAll();

  render() {
    const { selectAllVisible, selectedRecords, total, className, forwardedRef, isMobile } = this.props;

    return (
      <div ref={forwardedRef} className={classNames('grid-tools', className)}>
        {!isMobile && !selectAllVisible && (
          <div className="grid-tools__selected-count">{t('grid.tools.selected', { count: selectedRecords.length })}</div>
        )}
        {isFunction(this.props.onResetAll) && !!selectedRecords.length && (
          <Btn className="ecos-btn_extra-narrow grid-tools__item_select-all-btn ecos-btn_hover_light-blue2" onClick={this.resetAll}>
            {t('grid.tools.reset-all')}
          </Btn>
        )}
        {isFunction(this.props.onSelectAll) && (
          <Btn
            className={classNames('ecos-btn_extra-narrow grid-tools__item_select-all-btn ecos-btn_hover_light-blue2', {
              'ecos-btn_blue': selectAllVisible
            })}
            onClick={this.selectAll}
          >
            {t(selectAllVisible ? 'grid.tools.selected-all' : 'grid.tools.select-all')} {total}
          </Btn>
        )}
        {this.createToolsActions()}
      </div>
    );
  }
}
