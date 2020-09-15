import React from 'react';
import { connect } from 'react-redux';

import MobileDocuments from './MobileDocuments';
import DesktopDocuments from './DesktopDocuments';

import './style.scss';

function Documents(props) {
  if (props.isMobile) {
    return <MobileDocuments {...props} />;
  }

  return <DesktopDocuments {...props} />;
}

const mapStateToProps = state => ({ isMobile: state.view.isMobile });

export default connect(mapStateToProps)(Documents);
