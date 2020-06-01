import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { getBase64Barcode } from '../../../actions/barcode';
import { getBarcodePrintUrl } from '../../../helpers/urls';
import { t } from '../../../helpers/util';
import { Btn } from '../../common/btns/index';

import './style.scss';

const Labels = {
  BTN_GENERATE: 'barcode-widget.btn.generate',
  BTN_GENERATE_NEW: 'barcode-widget.btn.generate-new',
  BTN_PRINT: 'barcode-widget.btn.print',
  TITLE: 'barcode-widget.dashlet.title'
};

const mapStateToProps = (state, context) => {
  const stateB = state.barcode[context.stateId] || {};

  return {
    barcode: stateB.barcode,
    error: stateB.error,
    isLoading: stateB.isLoading
  };
};

const mapDispatchToProps = (dispatch, { stateId, record }) => ({
  generateBase64Barcode: () => dispatch(getBase64Barcode({ stateId, record }))
});

class Barcode extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  componentDidMount() {
    this.runGenerateBarcode();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.runGenerateBarcode();
    }
  }

  runGenerateBarcode = () => {
    this.props.generateBase64Barcode();
  };

  runPrint = () => {
    const { record } = this.props;
    const url = getBarcodePrintUrl(record);

    window.open(url, '_blank');
  };

  render() {
    const { isLoading, barcode, error, className } = this.props;

    return (
      <div className={classNames('ecos-barcode', className)}>
        <div className="ecos-barcode__container">
          {error && <div className="ecos-barcode__error">{error}</div>}
          <Btn
            className="ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no"
            loading={isLoading}
            disabled={isLoading}
            onClick={this.runGenerateBarcode}
          >
            {!barcode ? t(Labels.BTN_GENERATE) : t(Labels.BTN_GENERATE_NEW)}
          </Btn>
          {barcode && <img className="ecos-barcode__image" src={barcode} alt={t(Labels.TITLE)} />}
        </div>
        <Btn className="ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no" onClick={this.runPrint} disabled={!!error}>
          {t(Labels.BTN_PRINT)}
        </Btn>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Barcode);
