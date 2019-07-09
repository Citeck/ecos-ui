import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isMobileDevice, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import DocStatus from './DocStatus';

import './style.scss';

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
    title: t('Статус документа'),
    classNameStatus: '',
    classNameDashlet: ''
  };

  className = 'ecos-doc-status-dashlet';

  render() {
    const { id, title, config, classNameStatus, classNameDashlet, record } = this.props;
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
      >
        <DocStatus {...config} className={classNameStatus} record={record} stateId={id} />
      </Dashlet>
    );
  }
}

export default DocStatusDashlet;
