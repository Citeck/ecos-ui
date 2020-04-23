import React from 'react';

const Alfresco = window.Alfresco || {};

export default class SwitchHintMenu extends React.Component {
  state = {
    isUseHintFunctionality: false,
    isShowHints: false
  };

  componentDidMount() {
    Alfresco.util.Ajax.jsonGet({
      url: Alfresco.constants.PROXY_URI + 'citeck/ecosConfig/ecos-config-value?configName=show-hints-parameter',
      dataObj: {
        query: '=cm:userName:"' + Alfresco.constants.USERNAME + '"',
        schema: JSON.stringify({ attributes: { 'org:showHints': '' } })
      },
      successCallback: {
        scope: this,
        fn: function(response) {
          if (response.json.value === 'true') {
            this.setState({ isUseHintFunctionality: true });
            Alfresco.util.Ajax.jsonGet({
              url: Alfresco.constants.PROXY_URI + 'citeck/search/query',
              dataObj: {
                query: '=cm:userName:"' + Alfresco.constants.USERNAME + '"',
                schema: JSON.stringify({ attributes: { 'org:showHints': '' } })
              },
              successCallback: {
                scope: this,
                fn: function(response) {
                  const showHintValue = response.json.results[0].attributes['org:showHints'];
                  this.setState({ isShowHints: showHintValue === 'true' });
                }
              }
            });
          }
        }
      }
    });
  }

  render() {
    const { isShowHints, isUseHintFunctionality } = this.state;
    if (!isUseHintFunctionality) {
      return null;
    }

    let title = Alfresco.util.message('hints.disabled');
    let url = '/share/res/components/images/header/hint_icon_off.png';
    if (isShowHints) {
      title = Alfresco.util.message('hints.enabled');
      url = '/share/res/components/images/header/hint_icon_on.png';
    }

    const backgroundImage = `url(${url})`;
    let imgIcon = (
      <div className="show-hint">
        <div id="HEADER_HINT_ICON" className="alfresco-header-showHint-icon" title={title} style={{ backgroundImage }} />
      </div>
    );

    return (
      <div id="HEADER_USER_MENU" className="alfresco-header-showHint">
        {imgIcon}
      </div>
    );
  }
}
