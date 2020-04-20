import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isMobileDevice, t } from '../../../helpers/util';
import Dashlet from '../../Dashlet/Dashlet';
import Barcode from './Barcode';
import BaseWidget from '../BaseWidget';

import './style.scss';

class BarcodeDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameBarcode: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    title: t('barcode-widget.dashlet.title'),
    classNameBarcode: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.stateId = `[${props.tabId}]-[${props.id}]`;
  }

  render() {
    const { title, config, classNameBarcode, classNameDashlet, record } = this.props;

    return (
      <Dashlet
        title={title}
        bodyClassName="ecos-barcode-dashlet__body"
        className={classNames('ecos-barcode-dashlet', classNameDashlet)}
        resizable={false}
        needGoTo={false}
        noActions
        actionDrag={isMobileDevice()}
      >
        <Barcode {...config} className={classNameBarcode} record={record} stateId={this.stateId} />
      </Dashlet>
    );
  }
}

export default BarcodeDashlet;
