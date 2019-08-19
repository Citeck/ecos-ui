import React, { Component, Fragment } from 'react';
import Loader from '../common/Loader/Loader';
import { IcoBtn } from '../common/btns';
import { getId, t, trigger } from '../../helpers/util';

export default class ColumnsSetup extends Component {
  form = React.createRef();
  id = getId();

  state = { loading: false };

  componentDidUpdate(prevProps) {
    const url = this.props.url;

    if (url && url !== prevProps.url) {
      this.export(url);
    }
  }

  export = url => {
    this.setState({ loading: false });
    let form = this.form.current;
    form.action = url;
    form.submit();
  };

  onClick = e => {
    this.setState({ loading: true });
    trigger.call(this, 'onClick', e);
  };

  render() {
    return (
      <Fragment>
        {this.state.loading ? (
          <Loader className={'ecos-loader_pin'} width={30} height={30} />
        ) : (
          <IcoBtn
            onClick={this.onClick}
            icon={'icon-download'}
            className={'ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown'}
            title={t('grid.tools.zip')}
          />
        )}

        <form ref={this.form} id={this.id} action="" method="get" encType="multipart/form-data" target="_self" />
      </Fragment>
    );
  }
}
