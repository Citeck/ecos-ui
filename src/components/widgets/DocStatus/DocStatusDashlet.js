import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isMobileDevice, t } from '../../../helpers/util';
import Dashlet from '../../Dashlet/Dashlet';
import DocStatus from './DocStatus';
import BaseWidget from '../BaseWidget';

import './style.scss';

class DocStatusDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    classNameStatus: PropTypes.string,
    classNameDashlet: PropTypes.string,
    title: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    classNameStatus: '',
    classNameDashlet: '',
    title: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isSmall: false
    };
  }

  onResize = w => {
    this.setState({ isSmall: w && w <= 263 });
  };

  render() {
    const { config, classNameStatus, classNameDashlet, record } = this.props;
    const { isSmall, isCollapsed } = this.state;
    const isMobile = isMobileDevice();
    const title = this.props.title || t('doc-status-widget.title');
    const isBig = !(isMobile || isSmall);

    return (
      <Dashlet
        title={title}
        className={classNames('ecos-doc-status-dashlet', classNameDashlet, { 'ecos-doc-status-dashlet_mobile': isMobile })}
        bodyClassName="ecos-doc-status-dashlet__body"
        resizable={false}
        collapsible={!isBig}
        needGoTo={false}
        noActions
        actionDrag={isMobile}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        noHeader={isBig}
      >
        <DocStatus title={title} isMobile={isMobile || isSmall} {...config} className={classNameStatus} record={record} stateId={record} />
      </Dashlet>
    );
  }
}

export default DocStatusDashlet;
