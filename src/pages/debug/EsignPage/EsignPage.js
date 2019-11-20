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

    return (
      <div>
        {isShowSignBtn && (
          <Esign
            /**
             * т.к. url's могут быть динамически настраиваться,
             */
            getDocumentsUrl="/share/proxy/alfresco/citeck/get-document-package?nodeRef=workspace://SpacesStore/73076562-0bda-4de4-9e32-a6720ae11e93"
            nodeRef="workspace://SpacesStore/73076562-0bda-4de4-9e32-a6720ae11e93"
            viewElement={props => (
              <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" {...props}>
                {t(Labels.SIGN_BTN)}
              </Btn>
            )}
            onSigned={this.handleSigned}
          />
        )}

        {/*
          параметр singleton - если на странице
          будет использоваться только один nodeRef
          Таким образом, функция openSignModal будет открывать только
          одну модалку
        */}
        <Esign
          singleton
          nodeRef="workspace://SpacesStore/aaddecb0-7aa6-4a26-8955-022c2afb1dac"
          getDocumentsUrl="/share/proxy/alfresco/citeck/get-document-package?nodeRef=workspace://SpacesStore/aaddecb0-7aa6-4a26-8955-022c2afb1dac"
        />
        <span onClick={() => openSignModal()} style={{ margin: '0 10px' }}>
          Click me!
        </span>
        <span onClick={() => openSignModal()} style={{ margin: '0 10px' }}>
          And me!
        </span>
      </div>
    );
  }
}

export default EsignPage;
