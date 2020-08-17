import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

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

  onResize = width => {
    this.setState({ isSmall: !!width && width <= 263 });
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
        className={classNames('ecos-doc-status-dashlet', classNameDashlet, {
          'ecos-doc-status-dashlet_mobile': isMobile
        })}
        bodyClassName={classNames('ecos-doc-status-dashlet__body', {
          'dashlet__body_no-bottom-indent': isBig
        })}
        resizable={false}
        collapsible={!isBig}
        needGoTo={false}
        noActions
        actionDrag={isMobile}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        noHeader={isBig}
        setRef={this.setDashletRef}
      >
        <Scrollbars {...this.scrollbarProps}>
          <DocStatus
            title={title}
            isMobile={isMobile || isSmall}
            {...config}
            className={classNameStatus}
            record={record}
            stateId={record}
          />
        </Scrollbars>
      </Dashlet>
    );
  }
}

export default DocStatusDashlet;
