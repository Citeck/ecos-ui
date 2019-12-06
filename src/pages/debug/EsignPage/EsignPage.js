import React, { Component } from 'react';

import Esign, { openSignModal } from '../../../components/Esign';
import { t } from '../../../helpers/util';
import { Btn } from '../../../components/common/btns';
import { Labels } from '../../../constants/esign';

class EsignPage extends Component {
  state = {
    isShowSignBtn: true
  };

  handleSigned = () => {
    this.setState({ isShowSignBtn: false });
  };

  render() {
    const { isShowSignBtn } = this.state;

    return <div />;
  }
}

export default EsignPage;
