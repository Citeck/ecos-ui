import classNames from 'classnames';
import PropTypes from 'prop-types';
import * as React from 'react';

import { Btn } from '@/components/common/btns/index';
import { t } from '@/helpers/util';
import DisplayElementService from '@/services/DisplayElementService';

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
    const { isLoading, isPrinting, printError, barcode, error, className, onPrint, onGenerate, displayElements = {} } = this.props;

    return (
      <div className={classNames('ecos-barcode', className)}>
        <div className="ecos-barcode__container">
          {error && <div className="ecos-barcode__error">{error}</div>}
          {(!barcode || DisplayElementService.checkResultCondition(displayElements.btnGenerateNew)) && (
            <Btn
              className="ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no"
              loading={isLoading}
              disabled={isLoading}
              onClick={onGenerate}
            >
              {barcode ? t(Labels.BTN_GENERATE_NEW) : t(Labels.BTN_GENERATE)}
            </Btn>
          )}
          {barcode && <img className="ecos-barcode__image" src={barcode} alt={t(Labels.TITLE)} />}
        </div>
        {printError && (
          <div className="ecos-barcode__error" role="alert">
            {printError}
          </div>
        )}
        {isPrinting && <div role="status">{t('barcode-widget.print.loading')}</div>}
        <Btn
          className="ecos-btn_blue ecos-btn_full-width"
          onClick={onPrint}
          disabled={!!error || isPrinting}
          loading={isPrinting}
          aria-label={t(Labels.BTN_PRINT)}
          aria-busy={!!isPrinting}
        >
          {t(Labels.BTN_PRINT)}
        </Btn>
      </div>
    );
  }
}

export default Barcode;
