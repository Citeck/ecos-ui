import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { IcoBtn } from '../common/btns';
import { t } from '../../helpers/util';

import './Dashlet.scss';

const Header = ({ title, needGoTo, onGoTo, onReload, onEdit, actionReload, actionEdit, actionHelp, actionDrag, measurer }) => {
  const btnGoTo = (
    <IcoBtn title={t('dashlet.goto')} invert={'true'} icon={'icon-big-arrow'} className={'dashlet__btn ecos-btn_narrow'} onClick={onGoTo}>
      {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
    </IcoBtn>
  );

  const actions = [];

  if (actionReload) {
    actions.push(
      <IcoBtn
        key="action-reload"
        icon={'icon-reload'}
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
        onClick={onReload}
        title={t('dashlet.update.title')}
      />
    );
  }

  if (actionEdit) {
    actions.push(
      <IcoBtn
        key="action-edit"
        icon={'icon-edit'}
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
        onClick={onEdit}
        title={t('dashlet.edit.title')}
      />
    );
  }

  if (actionHelp) {
    actions.push(
      <IcoBtn
        key="action-help"
        icon={'icon-question'}
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
        title={t('dashlet.help.title')}
      />
    );
  }

  if (actionDrag) {
    actions.push(
      <IcoBtn
        key="action-drag"
        icon={'icon-drag'}
        className={'ecos-btn_i dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1'}
        title={t('dashlet.move.title')}
      />
    );
  }

  return (
    <div className={'dashlet__header'}>
      <span className={'dashlet__caption'}>{title}</span>

      {needGoTo && btnGoTo}

      <div className={'dashlet__actions dashlet__actions_header'}>{actions}</div>
    </div>
  );
};

export default class Dashlet extends Component {
  static propTypes = {
    needGoTo: PropTypes.bool,
    actionReload: PropTypes.bool,
    actionEdit: PropTypes.bool,
    actionHelp: PropTypes.bool,
    actionDrag: PropTypes.bool,
    resizable: PropTypes.bool,
    onEdit: PropTypes.func,
    onGoTo: PropTypes.func,
    onReload: PropTypes.func
  };

  static defaultProps = {
    needGoTo: true,
    actionReload: true,
    actionEdit: true,
    actionHelp: true,
    actionDrag: true,
    resizable: false,
    onEdit: () => {},
    onGoTo: () => {},
    onReload: () => {}
  };

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
            <Header
              title={props.title}
              needGoTo={props.needGoTo}
              onGoTo={this.onGoTo}
              actionReload={props.actionReload}
              onReload={this.onReload}
              actionEdit={props.actionEdit}
              onEdit={this.onEdit}
              actionHelp={props.actionHelp}
              actionDrag={props.actionDrag}
            />
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
