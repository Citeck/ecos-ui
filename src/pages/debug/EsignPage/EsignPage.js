import React, { Component } from 'react';

import Esign from '../../../components/Esign';

class EsignPage extends Component {
  render() {
    return (
      <div>
        <Esign nodeRef="workspace://SpacesStore/d8aed563-594c-4bc8-899f-36d320f035a7" />
        <Esign />
      </div>
    );
  }
}

export default EsignPage;
