import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isMobileDevice, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import DocStatus from './DocStatus';

import './style.scss';
import UserLocalSettingsService from '../../services/userLocalSettings';

class DocStatusDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameStatus: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    title: t('doc-status-widget.title'),
    classNameStatus: '',
    classNameDashlet: ''
  };

  className = 'ecos-doc-status-dashlet';

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
    const { id, title, config, classNameStatus, classNameDashlet, record } = this.props;
    const { isCollapsed } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={false}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        actionDrag={isMobileDevice()}
        actionEdit={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <DocStatus {...config} className={classNameStatus} record={record} stateId={id} />
      </Dashlet>
    );
  }
}

export default DocStatusDashlet;
