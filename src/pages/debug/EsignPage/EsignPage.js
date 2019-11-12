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
            nodeRef="workspace://SpacesStore/d8aed563-594c-4bc8-899f-36d320f035a7"
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
        <Esign singleton />
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
