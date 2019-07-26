import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import EcosForm from '../EcosForm';
import './style.scss';
import { InfoText } from '../common';
import ReactResizeDetector from 'react-resize-detector';
import { getOptimalHeight } from '../../helpers/layout';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isReady: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    record: '',
    className: '',
    minHeight: 'inherit',
    maxHeight: 'inherit',
    isSmallMode: false,
    isReady: true
  };

  className = 'ecos-properties';

  state = {
    loaded: false,
    isReadySubmit: true,
    hideForm: false,
    contentHeight: 0
  };

  // hack for EcosForm force update on isSmallMode changing
  componentWillReceiveProps(nextProps) {
    if (nextProps.isSmallMode !== this.props.isSmallMode) {
      this.setState({ hideForm: true }, () => {
        this.setState({ hideForm: false });
      });
    }
  }

  get height() {
    const { loaded, contentHeight } = this.state;
    const { height, minHeight, maxHeight } = this.props;

    return getOptimalHeight(height, contentHeight, minHeight, maxHeight, !loaded);
  }

  onSubmitForm = () => {
    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  onReady = () => {
    this.setState({ loaded: true });
  };

  onResize = (w, contentHeight) => {
    this.setState({ contentHeight });
  };

  renderForm() {
    const { record, isSmallMode, isReady } = this.props;
    const { isReadySubmit, hideForm } = this.state;

    return !hideForm && isReady && isReadySubmit ? (
      <EcosForm
        record={record}
        options={{
          readOnly: true,
          viewAsHtml: true,
          viewAsHtmlConfig: {
            fullWidthColumns: isSmallMode
          }
        }}
        onSubmit={this.onSubmitForm}
        onReady={this.onReady}
        className={`${this.className}__formio`}
      />
    ) : (
      <InfoText text={'Сведения не загружены'} />
    );
  }

  render() {
    return (
      <Scrollbars
        autoHeight
        autoHeightMin={0}
        autoHeightMax={this.height}
        style={{ height: this.height }}
        className={`${this.className}__scroll`}
        renderTrackVertical={props => <div {...props} className={`${this.className}__scroll_v`} />}
      >
        <div className={`${this.className}__container`}>
          <ReactResizeDetector handleHeight onResize={this.onResize} />
          {this.renderForm()}
        </div>
      </Scrollbars>
    );
  }
}

export default Properties;
