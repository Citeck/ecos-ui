/*
 * Copyright (C) 2008-2016 Citeck LLC.
 *
 * This file is part of Citeck EcoS
 *
 * Citeck EcoS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Citeck EcoS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Citeck EcoS. If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
  /**
   * Sign document action
   *
   * @method onActionDocumentSign
   * @param asset {object} Object literal representing file or folder to be actioned
   */
  window.YAHOO.Bubbling.fire('registerAction', {
    actionName: 'onActionDocumentSign',
    fn: function(asset) {
      var nodeRef = asset.nodeRef;
      window.documentSign(nodeRef);
    }
  });

  window.YAHOO.Bubbling.fire('registerAction', {
    actionName: 'onActionDownloadSign',
    fn: function(record) {
      var signValue = record.jsNode.properties['sam:signValue'];

      if (!signValue) {
        var url =
          window.Alfresco.constants.PROXY_URI +
          'citeck/assocs?nodeRef=' +
          record.jsNode.nodeRef +
          '&assocTypes=sam:signLink&addAssocs=false';
        window.Alfresco.util.Ajax.jsonGet({
          url: url,
          successCallback: {
            scope: this,
            fn: function(response) {
              var childrens = response && response.json && response.json.children ? response.json.children : null;

              var signNodeRef = childrens && childrens.length > 0 && childrens[0] ? childrens[0].nodeRef : null;

              if (signNodeRef) {
                var redirection = window.Alfresco.constants.PROXY_URI + '/acm/getDecodeESign?nodeRef=' + signNodeRef;
                window.location = redirection;
              } else {
                window.Alfresco.util.PopupManager.displayPrompt({
                  title: this.msg('actions.sign.download.title'),
                  text: this.msg('actions.sign.download.text'),
                  noEscape: true,
                  buttons: [
                    {
                      text: this.msg('actions.button.ok'),
                      handler: function empt_ok() {
                        this.destroy();
                      },
                      isDefault: true
                    }
                  ]
                });
              }
            }
          }
        });
      } else {
        var redirection = window.Alfresco.constants.PROXY_URI + '/acm/getDecodeESign?nodeRef=' + record.jsNode.nodeRef;
        window.location = redirection;
      }
    }
  });
})();
