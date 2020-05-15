
import { MenuApi } from '../../src/api/menu';
import '../../src/build-info';
import * as journalsApi from '../../src/api/export/journalsApi';
import { modules } from '../../src/services/EcosModules';

export default {
  ...modules,
  'reactstrap': () => import('reactstrap'),
  'react-custom-scrollbars': () => import('react-custom-scrollbars'),
  'journals-dashlet': () => import('../../src/components/widgets/JournalsDashlet/export'),
  'menu-api': () => MenuApi,
  'cardlet-node-view': () => import('../../src/legacy/cardlets/node-view/node-view'),
  'journalsApi': () => journalsApi,
  'header': () => import('../../src/components/Header/export'),
  'header-legacy': () => import('../../src/legacy/header/index'),
  'slide-menu': () => import('../../src/components/Sidebar/export'),
  'slide-menu-legacy': () => import('../../src/legacy/SlideMenu/export'),
  'user-in-groups-list-helper': () => import('../../src/helpers/export/userInGroupsHelper')
};
