import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isMobileDevice } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import DocStatus from './DocStatus';

import './style.scss';

class DocStatusDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    classNameStatus: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    classNameStatus: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  render() {
    const { id, config, classNameStatus, classNameDashlet, record } = this.props;
    const { isCollapsed } = this.state;

    return (
      <Dashlet
        className={classNames('ecos-doc-status-dashlet', classNameDashlet)}
        bodyClassName="ecos-doc-status-dashlet__body"
        resizable={false}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        actionDrag={isMobileDevice()}
        actionEdit={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        noHeader
      >
        <DocStatus {...config} className={classNameStatus} record={record} stateId={id} />
      </Dashlet>
    );
  }
}

export default DocStatusDashlet;
