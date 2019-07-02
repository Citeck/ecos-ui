import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import EcosForm from '../EcosForm';
import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    sourceId: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isReady: PropTypes.bool
  };

  static defaultProps = {
    sourceId: '',
    record: '',
    className: '',
    isSmallMode: false,
    isReady: true
  };

  className = 'ecos-properties';

  state = {
    isReadySubmit: true
  };

  onSubmitForm = () => {
    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  renderForm() {
    const { record, isSmallMode, isReady } = this.props;
    const { isReadySubmit } = this.state;

    return isReady && isReadySubmit ? (
      <EcosForm
        record={record}
        options={{
          readOnly: true,
          viewAsHtml: true,
          viewAsHtmlConfig: {
            fullWidthColumns: true,
            hidePanels: true,
            alwaysWrap: isSmallMode
          }
        }}
        onSubmit={this.onSubmitForm}
      />
    ) : null;
  }

  render() {
    const { height } = this.props;

    return (
      <div className={`${this.className}__wrapper`}>
        <Scrollbars style={{ height }} className={`${this.className}__scroll`}>
          <div className={`${this.className}__container`}>{this.renderForm()}</div>
        </Scrollbars>
      </div>
    );
  }
}

export default Properties;
