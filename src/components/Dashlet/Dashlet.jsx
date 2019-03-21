import React, { Component } from 'react';
import classNames from 'classnames';
import Panel from '../common/panels/Panel/Panel';
import { IcoBtn } from '../common/btns';
import { t } from '../../helpers/util';

import './Dashlet.scss';

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
        bodyClassName={'dashlet__body'}
        header={
          <div className={'dashlet__header'}>
            <span className={'dashlet__caption'}>{props.title}</span>

            <IcoBtn
              invert={'true'}
              icon={'icon-big-arrow'}
              className={'dashlet__btn btn_blue btn_light-blue btn_hover_dark-blue2'}
              onClick={this.onGoTo}
            >
              {t('dashlet.goto')}
            </IcoBtn>

            <div className={'dashlet__actions'}>
              <IcoBtn
                icon={'icon-reload'}
                className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'}
                onClick={this.onReload}
              />
              <IcoBtn
                icon={'icon-edit'}
                className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'}
                onClick={this.onEdit}
              />
              <IcoBtn
                icon={'icon-question'}
                className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'}
                title={t('dashlet.help.title')}
              />
            </div>
          </div>
        }
      >
        {props.children}
      </Panel>
    );
  }
}
