import React from 'react';

class CardDetails extends React.Component {
  state = {
    innerHtml: null
  };

  componentDidMount() {
    const pageUrl = '/share/page/card-details?nodeRef=workspace://SpacesStore/074277e0-3cdb-4fa1-af5f-c0659db83662';
    // const pageUrl = '/share/service/citeck/surf/region?regionId=web-preview&nodeRef=workspace%3A%2F%2FSpacesStore%2F074277e0-3cdb-4fa1-af5f-c0659db83662&scope=page&theme=citeckTheme&pageid=card-details&htmlid=cardlet-remote-web-preview';
    // const pageUrl = 'http://localhost:8089/share/service/citeck/surf/region?regionId=metadata&nodeRef=workspace%3A%2F%2FSpacesStore%2F074277e0-3cdb-4fa1-af5f-c0659db83662&scope=page&theme=citeckTheme&pageid=card-details&htmlid=cardlet-remote-metadata';

    // return fetch(pageUrl, {
    //   credentials: 'include',
    //   method: 'get',
    //   mode: 'cors',
    // })
    //   .then((response) => {
    //     if (response.status >= 200 && response.status < 300) {
    //       return response;
    //     }
    //
    //     const error = new Error(response.statusText);
    //     error.response = response;
    //     throw error;
    //   })
    //   .then(response => response.text()).then(html => {
    //     // console.log('html', html);
    //     var re = /\/\/<!\[CDATA\[/gi;
    //     var re2 = /\/\/]]>/gi;
    //
    //     html = html.replace(re, '');
    //     html = html.replace(re2, '');
    //     console.log('html', html);
    //
    //     this.setState({
    //       innerHtml: html
    //     });
    //   }).catch(err => {
    //     console.log('err', err.message);
    //   });

    let html2 = `
        <script type="text/javascript" src="/share/res/js/citeck/lib/polyfill/babel-polyfill.min.js"></script>
        <script type="text/javascript" src="/share/res/js/citeck/lib/polyfill/fetch.min.js" ></script>

        <script type="text/javascript">//<![CDATA[
            var appContext = "\\/share";

            var dojoConfig = {
                baseUrl: "\\/share/res/",
                tlmSiblingOfDojo: false,
                locale: (navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage)).toLowerCase(),
                async: true,
                parseOnLoad: false,
                cacheBust: "3.5.0.18.11.12.11.59",
                packages: [
                    { name: "jquerymmenu", location: "/share/res/js/citeck/lib", main: "jquery.mmenu.all.min"},
                    { name: "react-dom", location: "/share/res/js/citeck/lib", main: "react-dom.min"},
                    { name: "react-redux", location: "/share/res/js/citeck/lib", main: "react-redux.min"},
                    { name: "svg4everybody", location: "js/lib/svg4everybody", main: "svg4everybody.min"},
                    { name: "redux", location: "/share/res/js/citeck/lib", main: "redux.min"},
                    { name: "dijit", location: "js/lib/dojo-1.10.4/dijit"},
                    { name: "cmm", location: "js/alfresco/cmm"},
                    { name: "citeckMenuBarPopup", location: "js/citeck/menus/citeckMenuBarPopup"},
                    { name: "citeckLogo", location: "js/citeck/logo/citeckLogo"},
                    { name: "showdown", location: "js/lib/showdown-1.3.0", main: "showdown.min"},
                    { name: "react", location: "/share/res/js/citeck/lib", main: "react.min"},
                    { name: "jquery", location: "js/lib/jquery-1.11.1", main: "jquery-1.11.1.min"},
                    { name: "citeckHeaderItem", location: "js/citeck/header/citeckMenuItem"},
                    { name: "react-custom-scrollbars", location: "/share/res/js/citeck/lib", main: "react-custom-scrollbars.min"},
                    { name: "citeckMenuBarItem", location: "js/citeck/menus/citeckMenuBarItem"},
                    { name: "share", location: "js/share"},
                    { name: "dojox", location: "js/lib/dojo-1.10.4/dojox"},
                    { name: "react-bootstrap", location: "/share/res/js/citeck/lib", main: "react-bootstrap.min"},
                    { name: "webscripts", location: "../service/1-0-63"},
                    { name: "surf", location: "js/surf"},
                    { name: "citeckMenuItem", location: "js/citeck/menus/citeckMenuItem"},
                    { name: "jqueryscrollbar", location: "/share/res/js/citeck/lib", main: "jquery.nicescroll.min"},
                    { name: "alfresco", location: "js/aikau/1.0.63/alfresco"},
                    { name: "citeckMenuGroup", location: "js/citeck/menus/citeckMenuGroup"},
                    { name: "xstyle", location: "/share/res/js/citeck/lib/xstyle", main: "css.min"},
                    { name: "cm", location: "js/lib/code-mirror"},
                    { name: "share-components", location: "components"},
                    { name: "service", location: "../service"},
                    { name: "jqueryui", location: "js/lib/jquery-ui-1.11.1", main: "jquery-ui.min"},
                    { name: "dojo", location: "js/lib/dojo-1.10.4/dojo"}
                ]
            };
        //]]></script>

        <script type="text/javascript" src="/share/res/js/lib/dojo-1.10.4/dojo/dojo.js"></script>


   <script type="text/javascript" src="/share/service/messages_d3b5c0086e181469d03b681f2b33a5e9.js?locale=ru"></script>

   <style type="text/css" media="screen">
      @import url("/share/res/css/yui-fonts-grids_fe8fbe97553ea9e004731970a95a499b.css");
      @import url("/share/res/yui/columnbrowser/assets/columnbrowser_a6ca750d53c6b6c201614545f6c33ee7.css");
      @import url("/share/res/yui/columnbrowser/assets/skins/default/columnbrowser-skin_8d0c089e2ba8e57eaf72126e1fff5581.css");
      @import url("/share/res/themes/citeckTheme/yui/assets/skin_d61c248745a22f868c969d0cc18f0516.css");
      @import url("/share/res/css/base_b1b9615640803c553a02f8dfa9bc59ac.css");
      @import url("/share/res/css/yui-layout_dcf75721dfd8e8e7c46cdcf6a269cedd.css");
      @import url("/share/res/themes/citeckTheme/presentation_c92ec95782cc0016f88ad189288769a8.css");
      @import url("/share/res/modules/create-site_a38bada01786d33165967625c46d10fd.css");
   </style>

   <style type="text/css" media="screen">
      @import url("/share/res/components/form/form_2912bd6700da67b8ca6974dca52b6ebe.css");
   </style>

   <style type="text/css" media="screen">
      @import url("/share/res/js/lib/dojo-1.10.4/dijit/themes/claro/claro_cca50166019f5e7251eadfc9247b6551.css");
   </style>



   <!-- Icons -->
   <link rel="shortcut icon" href="/share/res/favicon.ico" type="image/vnd.microsoft.icon" />
   <link rel="icon" href="/share/res/favicon.ico" type="image/vnd.microsoft.icon" />


   



   <!-- Alfresco web framework common resources -->
   <script type="text/javascript" src="/share/res/modules/editors/tinymce/tinymce.min.js?checksum=f34ea2e33cbdf16fb05ecb3e9a6f6562"></script>




        <style type="text/css">
            @font-face {
                font-family: 'Open Sans';
                font-style: normal;
                font-weight: 400;
                src: url(/share/res/js/aikau/1.0.63/alfresco/core/css/opensans.woff) format('woff');
            }
            @font-face {
                font-family: 'Open Sans Bold';
                font-style: normal;
                font-weight: 600;
                src: url(/share/res/js/aikau/1.0.63/alfresco/core/css/opensansbold.woff) format('woff');
            }
            @font-face {
                font-family: 'Open Sans Condensed';
                font-style: normal;
                font-weight: 300;
                src: url(/share/res/js/aikau/1.0.63/alfresco/core/css/opensanscondensed.woff) format('woff');
            }
            .alfresco-share .alfresco-header-SearchBox .alfresco-header-SearchBox-clear {
                background-image: url(/share/res/js/aikau/1.0.63/alfresco/css/images/Delete.PNG);
            }
        </style>
    </head>


        <div id="page-content-root">
            <div id="card-details-root"></div>
        </div>



   <script type="text/javascript" src="/share/res/js/yui-common_85fe398e5deaf2958d87495ebd1e083d.js"></script>
   <script type="text/javascript" src="/share/res/yui/history/history_543b42a00a378f4d4b6e70c81d915b0a.js"></script>
   <script type="text/javascript" src="/share/res/js/bubbling.v2.1_5a671b93e806ea64b41f915cf6147232.js"></script>
   <script type="text/javascript">//<![CDATA[
      YAHOO.Bubbling.unsubscribe = function(layer, handler, scope)
      {
         this.bubble[layer].unsubscribe(handler, scope);
      };
//]]></script>
   <script type="text/javascript">//<![CDATA[
      <!-- Alfresco web framework constants -->
      Alfresco.constants = Alfresco.constants || {};
      Alfresco.constants.DEBUG = false;
      Alfresco.constants.AUTOLOGGING = false;
      Alfresco.constants.PROXY_URI = window.location.protocol + "//" + window.location.host + "\\/share/proxy/alfresco/";
      Alfresco.constants.PROXY_URI_RELATIVE = "\\/share/proxy/alfresco/";
      Alfresco.constants.PROXY_FEED_URI = window.location.protocol + "//" + window.location.host + "\\/share/proxy/alfresco-feed/";
      Alfresco.constants.THEME = "citeckTheme";
      Alfresco.constants.URL_CONTEXT = "\\/share/";
      Alfresco.constants.URL_RESCONTEXT = "\\/share/res/";
      Alfresco.constants.URL_PAGECONTEXT = "\\/share/page/";
      Alfresco.constants.URL_SERVICECONTEXT = "\\/share/service/";
      Alfresco.constants.URL_FEEDSERVICECONTEXT = "\\/share/feedservice/";
      Alfresco.constants.USERNAME = "admin";
      Alfresco.constants.SITE = "";
      Alfresco.constants.PAGECONTEXT = "";
      Alfresco.constants.PAGEID = "";
      Alfresco.constants.JS_LOCALE = "ru";
      Alfresco.constants.USERPREFERENCES = "{\\"org\\": {\\"alfresco\\": {\\"share\\": {\\"mydocuments\\": {\\"dashlet\\": {\\"component-2-2\\": {\\"filter\\": \\"recentlyModifiedByMe\\", \\"simpleView\\": true}}}, \\"searchList\\": {\\"viewRendererName\\": \\"detailed\\"}, \\"sites\\": {\\"recent\\": {\\"_0\\": \\"contracts\\", \\"_1\\": \\"letters\\", \\"_2\\": \\"cases\\", \\"_3\\": \\"order-pass\\", \\"_4\\": \\"orders\\"}}, \\"twisters\\": {\\"collapsed\\": \\"products-and-services,history,cardTemplates,case-activities,webPreview,Comments,webPreview,node-view,webPreview\\"}}}}}";
      Alfresco.constants.CSRF_POLICY = {
         enabled: false,
         cookie: "{token}",
         header: "{token}",
         parameter: "{token}",
         properties: {}
      };
      Alfresco.constants.CSRF_POLICY.properties["token"] = "Alfresco-CSRFToken";
      Alfresco.constants.CSRF_POLICY.properties["referer"] = "";
      Alfresco.constants.CSRF_POLICY.properties["origin"] = "";

      Alfresco.constants.IFRAME_POLICY =
      {
         sameDomain: "allow",
         crossDomainUrls: [
            "*"
         ]
      };
      
      Alfresco.constants.HIDDEN_PICKER_VIEW_MODES = [
      ];
      
      Alfresco.constants.MENU_ARROW_SYMBOL = "&#9662;";

      Alfresco.constants.TINY_MCE_SUPPORTED_LOCALES = "en,de,es,fr,it,ja,nl,zh_CN,ru,nb,pt_BR";
//]]></script>
   <script type="text/javascript" src="/share/res/js/flash/AC_OETags_23681d043aef7e80993a9f9354d71741.js"></script>
   <script type="text/javascript" src="/share/res/js/alfresco_59f641aae3a63a5f1e6b5b89754aa9e0.js"></script>
   <script type="text/javascript" src="/share/res/modules/editors/tiny_mce_947dfc74b7dbff0f5062c429a469db58.js"></script>
   <script type="text/javascript" src="/share/res/modules/editors/yui_editor_0a0da13c6dc370802cb4c2dc6ef1f559.js"></script>
   <script type="text/javascript" src="/share/res/js/forms-runtime_84ade72e6aefcb83b54f90b3b5f57145.js"></script>
   <script type="text/javascript">//<![CDATA[
      <!-- Share Constants -->
      Alfresco.service.Preferences.FAVOURITE_DOCUMENTS = "org.alfresco.share.documents.favourites";
      Alfresco.service.Preferences.FAVOURITE_FOLDERS = "org.alfresco.share.folders.favourites";
      Alfresco.service.Preferences.FAVOURITE_FOLDER_EXT = "org.alfresco.ext.folders.favourites.";
      Alfresco.service.Preferences.FAVOURITE_DOCUMENT_EXT = "org.alfresco.ext.documents.favourites.";
      Alfresco.service.Preferences.FAVOURITE_SITES = "org.alfresco.share.sites.favourites";
      Alfresco.service.Preferences.IMAP_FAVOURITE_SITES = "org.alfresco.share.sites.imapFavourites";
      Alfresco.service.Preferences.COLLAPSED_TWISTERS = "org.alfresco.share.twisters.collapsed";
      Alfresco.service.Preferences.RULE_PROPERTY_SETTINGS = "org.alfresco.share.rule.properties";
      Alfresco.constants.URI_TEMPLATES =
      {
         "remote-site-page": "/site/{site}/{pageid}/p/{pagename}",
         "remote-page": "/{pageid}/p/{pagename}",
         "share-site-page": "/site/{site}/{pageid}/ws/{webscript}",
         "sitedashboardpage": "/site/{site}/dashboard",
         "contextpage": "/context/{pagecontext}/{pageid}",
         "sitepage": "/site/{site}/{pageid}",
         "userdashboardpage": "/user/{userid}/dashboard",
         "userpage": "/user/{userid}/{pageid}",
         "userprofilepage": "/user/{userid}/profile",
         "userdefaultpage": "/user/{pageid}",
         "consoletoolpage": "/console/{pageid}/{toolid}",
         "consolepage": "/console/{pageid}",
         "share-page": "/{pageid}/ws/{webscript}",
         "journals": "/{pageid}/list/{listId}",
         "sitejournals": "/site/{site}/{pageid}/list/{listId}",
         "journals": "/{pageid}/list/{listId}",
         "sitejournals": "/site/{site}/{pageid}/list/{listId}"
      };
      Alfresco.constants.HELP_PAGES =
      {
         "share-help": "http://docs.alfresco.com/community/topics/sh-uh-welcome.html",
         "share-tutorial": "http://docs.alfresco.com/community/topics/alfresco-video-tutorials.html"
      };
      Alfresco.constants.HTML_EDITOR = 'tinyMCE';
      Alfresco.constants.QUICKSHARE_URL = "\\/share\\/s\\/{sharedId}";
      Alfresco.constants.LINKSHARE_ACTIONS = [
         {
         id: "email", type: "link", index: 10,
         params: { "href": "mailto:?subject={subject}&body={body}","target": "new" }
         },
         {
         id: "facebook", type: "link", index: 20,
         params: { "href": "https:\\/\\/www.facebook.com\\/sharer\\/sharer.php?u={shareUrl}&t={message}","target": "new" }
         },
         {
         id: "twitter", type: "link", index: 30,
         params: { "href": "https:\\/\\/twitter.com\\/intent\\/tweet?text={message}&url={shareUrl}","target": "new" }
         },
         {
         id: "google-plus", type: "link", index: 40,
         params: { "href": "https:\\/\\/plus.google.com\\/share?url={shareUrl}","target": "new" }
         }
      ];
//]]></script>
   <script type="text/javascript" src="/share/res/js/share_bd3d23c66f7be6f4524d923c62dc2b3e.js"></script>
   <script type="text/javascript" src="/share/res/js/lightbox_bc0f7ca3f123011aa02ad82dace7cae3.js"></script>
   <script type="text/javascript" src="/share/res/modules/create-site_60c9a76848df17fa1f408ecfa0fba17f.js"></script>

            <script type="text/javascript">//<![CDATA[

                require(['js/citeck/modules/page/card-details/card-details'], function(components) {
                    components.renderPage('card-details-root', {
                        alfescoUrl: window.location.protocol + "//" + window.location.host + "\\/share/proxy/alfresco/",
                        pageArgs: {
                                "nodeRef":"workspace://SpacesStore/074277e0-3cdb-4fa1-af5f-c0659db83662",
                                "pageid":"card-details",
                                "theme":"citeckTheme",
                                "aikauVersion":"1.0.63"
                        },
                        userName: "admin",
                        nodeBaseInfo: {"modified": "2018-11-07T18:42:48.610+03:00", "permissions": {"Read": true, "Write": true}, "pendingUpdate": false}
                    });
                });

                <!-- Android & iPad CSS overrides -->
                if (navigator.userAgent.indexOf(" Android ") !== -1 || navigator.userAgent.indexOf("iPad;") !== -1 || navigator.userAgent.indexOf("iPhone;") !== -1 ) {
                    document.write("<link media='only screen and (max-device-width: 1024px)' rel='stylesheet' type='text/css' href='/share/res/css/tablet_7de8a1be3071a0284dec03f751448cb0.css'/>");
                    document.write("<link rel='stylesheet' type='text/css' href='/share/res/css/tablet_7de8a1be3071a0284dec03f751448cb0.css'/>");
                }
            //]]></script>

            <div id="alfresco-yuiloader"></div>

            <script type="text/javascript">//<![CDATA[
                Alfresco.util.YUILoaderHelper.loadComponents(true);
                    Alfresco.util.Ajax.jsonGet({
                        url: Alfresco.constants.URL_CONTEXT + "service/modules/authenticated?noCache=" + new Date().getTime() + "&a=user"
                    });
            //]]></script>
`;

    var re = /\/\/<!\[CDATA\[/gi;
    var re2 = /\/\/]]>/gi;

    html2 = html2.replace(re, '');
    html2 = html2.replace(re2, '');

    this.setState({
      innerHtml: html2
    });

    /*
    this.setState({
      innerHtml: ,
    });
*/
    //
  }

  componentWillUnmount() {}

  render() {
    if (!this.state.innerHtml) {
      return null;
    }

    return <div dangerouslySetInnerHTML={{ __html: this.state.innerHtml }} />;
  }
}

export default CardDetails;
