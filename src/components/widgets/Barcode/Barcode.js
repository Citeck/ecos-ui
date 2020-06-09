import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { Btn } from '../../common/btns/index';

import './style.scss';

const Labels = {
  BTN_GENERATE: 'barcode-widget.btn.generate',
  BTN_GENERATE_NEW: 'barcode-widget.btn.generate-new',
  BTN_PRINT: 'barcode-widget.btn.print',
  TITLE: 'barcode-widget.dashlet.title'
};

class Barcode extends React.Component {
  static propTypes = {
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  render() {
    const { isLoading, barcode, error, className, onPrint, onGenerate } = this.props;

    return (
      <div className={classNames('ecos-barcode', className)}>
        <div className="ecos-barcode__container">
          {error && <div className="ecos-barcode__error">{error}</div>}
          <Btn
            className="ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no"
            loading={isLoading}
            disabled={isLoading}
            onClick={onGenerate}
          >
            {!barcode ? t(Labels.BTN_GENERATE) : t(Labels.BTN_GENERATE_NEW)}
          </Btn>
          {barcode && <img className="ecos-barcode__image" src={barcode} alt={t(Labels.TITLE)} />}
        </div>
        <Btn className="ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no" onClick={onPrint} disabled={!!error}>
          {t(Labels.BTN_PRINT)}
        </Btn>
      </div>
    );
  }
}

export default Barcode;
