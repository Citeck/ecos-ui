import React from 'react';
import NodeCardlet from '../node-cardlet';

import './remote.css';

export default class RemoteCardlet extends NodeCardlet {
  static getFetchKey(ownProps) {
    return ownProps.nodeRef;
  }

  static fetchData(ownProps, onSuccess, onFailure) {
    let htmlid = 'cardlet-remote-' + ownProps.id;

    let reqParams = Object.assign({}, ownProps.controlProps);
    let remoteUrl = reqParams.remoteUrl;

    delete reqParams.remoteUrl;
    reqParams.htmlid = htmlid;

    let fullUrl = remoteUrl + '?' + window.$.param(reqParams);

    let data = {
      id: ownProps.id,
      htmlid
    };

    window.Citeck.utils.loadHtml({
      url: fullUrl,
      htmlDest: text => {
        data['htmlText'] = text;
      },
      jsInlineDest: inlineScripts => {
        data['jsInlineScripts'] = inlineScripts;
      },
      onFailure: () => {
        console.error('error');
        onFailure(arguments);
      },
      onSuccess: () => onSuccess(data)
    });
  }

  componentDidMount() {
    let scripts = this.props.data.jsInlineScripts;
    for (let i = 0; i < scripts.length; i++) {
      eval(scripts[i]);
    }
  }

  render() {
    let html = this.props.data.htmlText;
    let htmlid = this.props.data.htmlid;

    return <div id={htmlid + '-container'} dangerouslySetInnerHTML={{ __html: html }} />;
  }
}
