import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';
import EcosForm, { FORM_MODE_EDIT } from '../EcosForm';
import { DefineHeight, InfoText, Loader } from '../common';

import './style.scss';

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

  onSubmitForm = () => {
    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  onReady = () => {
    this.setState({ loaded: true });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderLoader() {
    const { loaded } = this.state;
    if (!loaded) {
      return <Loader className={`${this.className}__loader`} />;
    }

    return null;
  }

  renderForm() {
    const { record, isSmallMode, isReady } = this.props;
    const { isReadySubmit, hideForm } = this.state;

    return !hideForm && isReady && isReadySubmit ? (
      <React.Fragment>
        {this.renderLoader()}
        <EcosForm
          record={record}
          options={{
            readOnly: true,
            viewAsHtml: true,
            viewAsHtmlConfig: {
              fullWidthColumns: isSmallMode
            },
            formMode: FORM_MODE_EDIT
          }}
          onSubmit={this.onSubmitForm}
          onReady={this.onReady}
          className={`${this.className}__formio`}
        />
      </React.Fragment>
    ) : (
      <InfoText text={t('properties-widget.no-form.text')} />
    );
  }

  render() {
    const { loaded, contentHeight } = this.state;
    const { height, minHeight, maxHeight } = this.props;

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className={`${this.className}__scroll`}
        renderTrackVertical={props => <div {...props} className={`${this.className}__scroll_v`} />}
      >
        <DefineHeight fixHeight={height} maxHeight={maxHeight} minHeight={minHeight} isMin={!loaded} getOptimalHeight={this.setHeight}>
          {this.renderForm()}
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default Properties;
