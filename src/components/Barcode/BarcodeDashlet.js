import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isMobileDevice, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Barcode from './Barcode';

import './style.scss';

class BarcodeDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameBarcode: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    title: t('Штрих-код документа'),
    classNameBarcode: '',
    classNameDashlet: ''
  };

  className = 'ecos-barcode-dashlet';

  render() {
    const { id, title, config, classNameBarcode, classNameDashlet, record } = this.props;
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
        <Barcode {...config} className={classNameBarcode} record={record} stateId={id} />
      </Dashlet>
    );
  }
}

export default BarcodeDashlet;
