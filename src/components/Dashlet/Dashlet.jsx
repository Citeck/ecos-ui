import React, { Component } from 'react';
import classNames from 'classnames';
import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { IcoBtn } from '../common/btns';
import { t } from '../../helpers/util';

import './Dashlet.scss';

const Header = ({ title, onGoTo, onReload, onEdit, measurer }) => {
  return (
    <div className={'dashlet__header'}>
      <span className={'dashlet__caption'}>{title}</span>

      <IcoBtn title={t('dashlet.goto')} invert={'true'} icon={'icon-big-arrow'} className={'dashlet__btn ecos-btn_narrow'} onClick={onGoTo}>
        {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
      </IcoBtn>

      <div className={'dashlet__actions dashlet__actions_header'}>
        <IcoBtn
          icon={'icon-reload'}
          className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
          onClick={onReload}
          title={t('dashlet.update.title')}
        />
        <IcoBtn
          icon={'icon-edit'}
          className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
          onClick={onEdit}
          title={t('dashlet.edit.title')}
        />
        <IcoBtn
          icon={'icon-question'}
          className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
          title={t('dashlet.help.title')}
        />
        <IcoBtn
          icon={'icon-drag'}
          className={'ecos-btn_i dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1'}
          title={t('dashlet.move.title')}
        />
      </div>
    </div>
  );
};

export default class Dashlet extends Component {
  onEdit = () => {
    const onEdit = this.props.onEdit;
    if (typeof onEdit === 'function') {
      onEdit.call(this);
    }
  };

  onGoTo = () => {
    const onGoTo = this.props.onGoTo;
    if (typeof onGoTo === 'function') {
      onGoTo.call(this);
    }
  };

  onReload = () => {
    const onReload = this.props.onReload;
    if (typeof onReload === 'function') {
      onReload.call(this);
    }
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('dashlet', props.className);

    return (
      <Panel
        {...props}
        className={cssClasses}
        headClassName={'ecos-panel__large'}
        bodyClassName={classNames('dashlet__body', props.bodyClassName)}
        header={
          <Measurer>
            <Header title={props.title} onGoTo={this.onGoTo} onReload={this.onReload} onEdit={this.onEdit} />
          </Measurer>
        }
      >
        {props.children}

        {props.resizable ? (
          <div className={'dashlet__resizer'}>
            <i className={'icon-resize ecos-btn__i'} title={t('dashlet.resize.title')} />
          </div>
        ) : null}
      </Panel>
    );
  }
}
