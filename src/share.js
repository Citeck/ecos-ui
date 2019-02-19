import { getCurrentLocale, dynamicallyLoadScript } from './helpers/util';

export function fillConstants() {
  return new Promise(resolve => {
    const Alfresco = window.Alfresco;

    window.require(['/share/service/constants/Default.js'], function(constants) {
      Alfresco.constants = Alfresco.constants || {};

      for (let constant in constants) {
        if (!constants.hasOwnProperty(constant)) {
          continue;
        }
        Alfresco.constants[constant] = constants[constant];
      }

      // TODO check constants
      Alfresco.constants.SITE = ''; // TODO !!! если нет константы, ломается card-details, вычислить из url?

      // window.Alfresco.constants.PROXY_URI = '/share/proxy/alfresco/';
      Alfresco.constants.PAGECONTEXT = '';

      Alfresco.constants.USERPREFERENCES =
        '{"org": {"alfresco": {"share": {"mydocuments": {"dashlet": {"component-2-2": {"filter": "recentlyModifiedByMe", "simpleView": true}}}, "searchList": {"viewRendererName": "detailed"}, "sites": {"recent": {"_0": "contracts", "_1": "letters", "_2": "cases", "_3": "order-pass", "_4": "orders"}}, "twisters": {"collapsed": "products-and-services,history,cardTemplates,case-activities,webPreview,Comments,webPreview,node-view,webPreview"}}}}}';

      Alfresco.constants.IFRAME_POLICY = {
        sameDomain: 'allow',
        crossDomainUrls: ['*']
      };

      Alfresco.constants.HIDDEN_PICKER_VIEW_MODES = [];

      Alfresco.constants.MENU_ARROW_SYMBOL = '&#9662;';

      Alfresco.constants.TINY_MCE_SUPPORTED_LOCALES = 'en,de,es,fr,it,ja,nl,zh_CN,ru,nb,pt_BR';

      Alfresco.service.Preferences.FAVOURITE_DOCUMENTS = 'org.alfresco.share.documents.favourites';
      Alfresco.service.Preferences.FAVOURITE_FOLDERS = 'org.alfresco.share.folders.favourites';
      Alfresco.service.Preferences.FAVOURITE_FOLDER_EXT = 'org.alfresco.ext.folders.favourites.';
      Alfresco.service.Preferences.FAVOURITE_DOCUMENT_EXT = 'org.alfresco.ext.documents.favourites.';
      Alfresco.service.Preferences.FAVOURITE_SITES = 'org.alfresco.share.sites.favourites';
      Alfresco.service.Preferences.IMAP_FAVOURITE_SITES = 'org.alfresco.share.sites.imapFavourites';
      Alfresco.service.Preferences.COLLAPSED_TWISTERS = 'org.alfresco.share.twisters.collapsed';
      Alfresco.service.Preferences.RULE_PROPERTY_SETTINGS = 'org.alfresco.share.rule.properties';

      Alfresco.constants.HELP_PAGES = {
        'share-help': 'http://docs.alfresco.com/community/topics/sh-uh-welcome.html',
        'share-tutorial': 'http://docs.alfresco.com/community/topics/alfresco-video-tutorials.html'
      };
      Alfresco.constants.HTML_EDITOR = 'tinyMCE';
      // Alfresco.constants.QUICKSHARE_URL = "\/share\/s\/{sharedId}";
      Alfresco.constants.LINKSHARE_ACTIONS = [
        {
          id: 'email',
          type: 'link',
          index: 10,
          params: { href: 'mailto:?subject={subject}&body={body}', target: 'new' }
        },
        {
          id: 'facebook',
          type: 'link',
          index: 20,
          params: { href: 'https://www.facebook.com/sharer/sharer.php?u={shareUrl}&t={message}', target: 'new' }
        },
        {
          id: 'twitter',
          type: 'link',
          index: 30,
          params: { href: 'https://twitter.com/intent/tweet?text={message}&url={shareUrl}', target: 'new' }
        },
        {
          id: 'google-plus',
          type: 'link',
          index: 40,
          params: { href: 'https://plus.google.com/share?url={shareUrl}', target: 'new' }
        }
      ];

      resolve();
    });
  });
}

export function requireScripts() {
  return new Promise(resolve => {
    window.require(
      [
        '/share/res/modules/editors/tinymce/tinymce.min.js',
        '/share/res/yui/history/history.js',
        '/share/res/js/bubbling.v2.1.js',

        '/share/res/js/flash/AC_OETags.js',
        '/share/res/modules/editors/tiny_mce.js',
        '/share/res/modules/editors/yui_editor.js',
        '/share/res/js/forms-runtime.js',

        '/share/res/js/share.js',
        '/share/res/modules/create-site.js',

        '/share/res/js/lightbox.js',
        '/share/res/js/citeck/modules/utils/citeck.js',
        '/share/res/citeck/components/form/constraints.js',

        '/share/res/citeck/mobile/mobile.js'
      ],
      function() {
        // TODO check it
        if (
          navigator.userAgent.indexOf(' Android ') !== -1 ||
          navigator.userAgent.indexOf('iPad;') !== -1 ||
          navigator.userAgent.indexOf('iPhone;') !== -1
        ) {
          // document.write(
          //   "<link media='only screen and (max-device-width: 1024px)' rel='stylesheet' type='text/css' href='/share/res/css/tablet.css'/>"
          // );
          // document.write("<link rel='stylesheet' type='text/css' href='/share/res/css/tablet.css'/>");
          window.require(['/share/res/css/tablet.css']);
        }

        window.Alfresco.util.YUILoaderHelper.loadComponents(true);

        window.YAHOO.Bubbling.unsubscribe = function(layer, handler, scope) {
          this.bubble[layer].unsubscribe(handler, scope);
        };

        resolve();
      }
    );
  });
}

export function requireStyles() {
  return new Promise(resolve => {
    window.require(
      [
        'xstyle!/share/res/css/yui-fonts-grids.css',
        'xstyle!/share/res/yui/columnbrowser/assets/columnbrowser.css',
        'xstyle!/share/res/yui/columnbrowser/assets/skins/default/columnbrowser-skin.css',
        'xstyle!/share/res/themes/citeckTheme/yui/assets/skin.css',
        'xstyle!/share/res/css/base.css',
        'xstyle!/share/res/js/citeck/modules/utils/citeck.css',
        'xstyle!/share/res/css/yui-layout.css',
        'xstyle!/share/res/themes/citeckTheme/presentation.css',
        'xstyle!/share/res/modules/create-site.css',
        'xstyle!/share/res/components/form/form.css',
        'xstyle!/share/res/js/lib/dojo-1.10.4/dijit/themes/claro/claro.css'
        // 'xstyle!https://fonts.googleapis.com/css?family=Open+Sans:300,400,600'
      ],
      function() {
        resolve();
      }
    );
  });
}

export function loadMessagesAndAlfrescoScript() {
  return new Promise(resolve => {
    dynamicallyLoadScript('/share/service/messages.js?locale=' + getCurrentLocale() + '&v=' + window.dojoConfig.cacheBust, () => {
      dynamicallyLoadScript('/share/res/js/alfresco.js?' + window.dojoConfig.cacheBust, () => {
        resolve();
      });
    });
  });
}

export function requireShareAssets() {
  return loadMessagesAndAlfrescoScript()
    .then(() => {
      return requireStyles();
    })
    .then(() => {
      return fillConstants();
    })
    .then(() => {
      return requireScripts();
    })
    .catch(e => {
      console.log('requireShareAssets error: ', e.message);
    });
}
