import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactToPrint from 'react-to-print';
import { getBarcode } from '../../actions/barcode';
import { selectDataBarcodeByStateId } from '../../selectors/barcode';
import { t } from '../../helpers/util';
import { Btn } from '../common/btns';
import './style.scss';

const mapStateToProps = (state, context) => {
  const stateB = selectDataBarcodeByStateId(state, context.stateId) || {};

  return {
    barcode: stateB.barcode,
    error: stateB.error,
    isLoading: stateB.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  getBarcode: payload => dispatch(getBarcode(payload))
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

  className = 'ecos-barcode';

  runGenerateBarcode = () => {
    const { stateId, record, getBarcode } = this.props;

    getBarcode({ stateId, record });
  };

  render() {
    const { isLoading, barcode, error } = this.props;
    const comClassesBtn = 'ecos-btn_blue ecos-btn_full-width ecos-btn_focus_no';
    return (
      <React.Fragment>
        <div className={`${this.className}__container`}>
          {error && <div className={`${this.className}__error`}>{error}</div>}
          <Btn loading={isLoading} className={comClassesBtn} onClick={this.runGenerateBarcode} disabled={isLoading}>
            {!barcode ? t('Сгенерировать') : t('Сгенерировать новый')}
          </Btn>
          {barcode && <img className={`${this.className}__image`} ref={el => (this.componentRef = el)} src={barcode} alt={''} />}
        </div>
        <ReactToPrint
          trigger={() => (
            <Btn disabled={!barcode && !isLoading} className={comClassesBtn}>
              {t('Распечатать')}
            </Btn>
          )}
          content={() => this.componentRef}
        />
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Barcode);
