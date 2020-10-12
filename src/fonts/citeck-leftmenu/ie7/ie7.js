/* To avoid CSS expressions while still supporting IE 7 and IE 6, use this script */
/* The script tag referencing this file must be placed before the ending body tag. */

/* Use conditional comments in order to target IE 7 and older:
	<!--[if lt IE 8]><!-->
	<script src="ie7/ie7.js"></script>
	<!--<![endif]-->
*/

(function() {
  function addIcon(el, entity) {
    var html = el.innerHTML;
    el.innerHTML = '<span style="font-family: \'citeck-leftmenu\'">' + entity + '</span>' + html;
  }
  var icons = {
      'i-leftmenu-current-tasks': '&#xe909;',
      'i-leftmenu-completed-tasks': '&#xf058;',
      'i-leftmenu-controlled': '&#xe908;',
      'i-leftmenu-subordinate-tasks': '&#xe90a;',
      'i-leftmenu-task-statistic': '&#xe90b;',
      'i-leftmenu-new-tasks': '&#xe915;',
      'i-leftmenu-new-tasks-1': '&#xf0fe;',
      'i-leftmenu-cases': '&#xe900;',
      'i-leftmenu-shared-documents-1': '&#xf079;',
      'i-leftmenu-shared-documents': '&#xe90c;',
      'i-leftmenu-meetings': '&#xe902;',
      'i-leftmenu-tax-report': '&#xf0ae;',
      'i-leftmenu-correspondence': '&#xe903;',
      'i-leftmenu-ord': '&#xe904;',
      'i-leftmenu-ord-1': '&#xf1ea;',
      'i-leftmenu-pass': '&#xe90d;',
      'i-leftmenu-contracts': '&#xe905;',
      'i-leftmenu-finances': '&#xf09d;',
      'i-leftmenu-power-attorney': '&#xf19c;',
      'i-leftmenu-hr-department': '&#xf0c0;',
      'i-leftmenu-personal-documents': '&#xe906;',
      'i-leftmenu-find-section': '&#xe907;',
      'i-leftmenu-new-section': '&#xe90e;',
      'i-leftmenu-organizational-structure': '&#xe90f;',
      'i-leftmenu-running-processes': '&#xe910;',
      'i-leftmenu-completed-processes': '&#xe911;',
      'i-leftmenu-workflows': '&#xf0db;',
      'i-leftmenu-material': '&#xf15b;',
      'i-leftmenu-content': '&#xe916;',
      'i-leftmenu-sections': '&#xe912;',
      'i-leftmenu-files': '&#x1f5ca;',
      'i-leftmenu-data-lists': '&#xe914;',
      'i-leftmenu-finances-1': '&#xf055;',
      'i-leftmenu-power-attorney-1': '&#xf187;',
      'i-leftmenu-repository': '&#xe91c;',
      'i-leftmenu-app': '&#x1f5bc;',
      'i-leftmenu-bpmn-editor': '&#xe91e;',
      'i-leftmenu-groups': '&#xe919;',
      'i-leftmenu-users': '&#xe91f;',
      'i-leftmenu-types': '&#xe920;',
      'i-leftmenu-system-journals': '&#xe91a;',
      'i-leftmenu-journal-settings': '&#xe91b;',
      'i-leftmenu-templates': '&#xe921;',
      'i-leftmenu-tools': '&#xe922;',
      'i-leftmenu-more': '&#x2689;',
      '0': 0
    },
    els = document.getElementsByTagName('*'),
    i,
    c,
    el;
  for (i = 0; ; i += 1) {
    el = els[i];
    if (!el) {
      break;
    }
    c = el.className;
    c = c.match(/i-leftmenu-[^\s'"]+/);
    if (c && icons[c[0]]) {
      addIcon(el, icons[c[0]]);
    }
  }
})();
