import React, { Component } from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import PanelBar from '../PanelBar/PanelBar';
import List from '../List/List';

import './CollapsibleList.scss';
import { InfoText } from '../index';

export default class CollapsibleList extends Component {
  render() {
    const { className, classNameList, close, children, height, list, selected, emptyText } = this.props;

    const Scroll = ({ height, children }) => (height ? <Scrollbars style={{ height }}>{children}</Scrollbars> : <>{children}</>);

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
        >
          {!(list && list.length) && !!emptyText && <InfoText noIndents text={emptyText} />}
          <Scroll height={height}>
            <List list={list} selected={selected} className={classNames('list-group_no-border', classNameList)} />
          </Scroll>
        </PanelBar>
      </div>
    );
  }
}
