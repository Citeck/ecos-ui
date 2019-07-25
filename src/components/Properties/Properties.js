import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import EcosForm from '../EcosForm';
import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isReady: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    record: '',
    className: '',
    isSmallMode: false,
    isReady: true
  };

  className = 'ecos-properties';

  state = {
    isReadySubmit: true,
    hideForm: false
  };

  onSubmitForm = () => {
    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  // hack for EcosForm force update on isSmallMode changing
  componentWillReceiveProps(nextProps) {
    if (nextProps.isSmallMode !== this.props.isSmallMode) {
      this.setState({ hideForm: true }, () => {
        this.setState({ hideForm: false });
      });
    }
  }

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
      />
    ) : null;
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars
        style={{ height }}
        className={`${this.className}__scroll`}
        renderTrackVertical={props => <div {...props} className={`${this.className}__scroll_v`} />}
      >
        <div className={`${this.className}__container`}>{this.renderForm()}</div>
      </Scrollbars>
    );
  }
}

export default Properties;
