import React, { Component } from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import PanelBar from '../PanelBar/PanelBar';
import List from '../List/List';
import { InfoText } from '../index';

import './CollapsibleList.scss';

export default class CollapsibleList extends Component {
  static defaultProps = {
    needScrollbar: true
  };

  renderList() {
    const { classNameList, list, selected, forwardedRef, needScrollbar, height } = this.props;
    const listComponent = (
      <List forwardedRef={forwardedRef} list={list} selected={selected} className={classNames('list-group_no-border', classNameList)} />
    );

    if (needScrollbar && height) {
      return <Scrollbars style={{ height }}>{listComponent}</Scrollbars>;
    }

    return listComponent;
  }

  render() {
    const { className, close, children, list, emptyText } = this.props;

    return (
      <div className={classNames('collapsible-list', className)}>
        <PanelBar
          open={!close && Boolean(list && list.length)}
          header={children}
          css={{
            headerClassName: 'panel-bar__header_full panel-bar__header_narrow ',
            headerLabelClassName: 'panel-bar__header-label_narrow panel-bar__header-label_bold',
            contentClassName: 'collapsible-list_panel-bar-header'
          }}
          collapseTheme={{
            collapse: 'collapsible-list__collapse'
          }}
        >
          {!(list && list.length) && !!emptyText && <InfoText noIndents text={emptyText} />}

          {this.renderList()}
        </PanelBar>
      </div>
    );
  }
}
