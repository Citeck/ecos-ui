import React, { Component } from 'react';
import classNames from 'classnames';
import Panel from '../common/panels/Panel/Panel';
import { IcoBtn } from '../common/btns';

import './Dashlet.scss';

export default class Dashlet extends Component {
  onEdit = () => {
    this.props.onEdit.call(this);
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('dashlet', props.className);

    return (
      <Panel
        {...props}
        className={cssClasses}
        header={
          <div className={'dashlet__header'}>
            <span className={'dashlet__caption'}>{'Договоры'}</span>

            <IcoBtn
              invert={'true'}
              icon={'icon-big-arrow'}
              className={'dashlet__btn btn_blue btn_light-blue btn_hover_dark-blue2'}
              onClick={this.onEdit}
            >
              Перейти в раздел
            </IcoBtn>

            <div className={'dashlet__actions'}>
              <IcoBtn icon={'icon-reload'} className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'} />
              <IcoBtn
                icon={'icon-edit'}
                className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'}
                onClick={this.onEdit}
              />
              <IcoBtn icon={'icon-question'} className={'btn_i dashlet__btn dashlet__btn_i btn_blue btn_hover_light-blue'} />
            </div>
          </div>
        }
      >
        {props.children}
      </Panel>
    );
  }
}
