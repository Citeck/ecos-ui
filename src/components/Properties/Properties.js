import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import Loader from '../common/Loader/Loader';

import './style.scss';
import EcosForm from '../EcosForm';

class Properties extends React.Component {
  static propTypes = {
    sourceId: PropTypes.string.isRequired,
    document: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool
  };

  static defaultProps = {
    sourceId: '',
    document: '',
    className: '',
    isSmallMode: false
  };

  className = 'ecos-properties';

  renderLoader() {
    let { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader />
      </div>
    );
  }

  renderForm() {
    const { document, isSmallMode } = this.props;

    return (
      <EcosForm
        record={document}
        options={{
          readOnly: true,
          viewAsHtml: true,
          viewAsHtmlConfig: {
            fullWidthColumns: true,
            hidePanels: true,
            alwaysWrap: isSmallMode
          }
        }}
      />
    );
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars style={{ height }} className={`${this.className}__scroll`}>
        <div className={`${this.className}__container`}>
          {this.renderLoader()}
          {this.renderForm()}
        </div>
      </Scrollbars>
    );
  }
}

export default Properties;
