import { MenuApi } from '../../src/api/menu';
import '../../src/build-info';
import * as journalsApi from '../../src/api/export/journalsApi';
import { modules } from '../../src/services/EcosModules';

export default {
  ...modules,
  'legacy-cmmn-editor': () => import('../../src/legacy/cmmn-editor/LegacyCmmnEditor'),
  'reactstrap': () => import('reactstrap'),
  'react-custom-scrollbars': () => import('react-custom-scrollbars'),
  'journals-dashlet': () => import('../../src/components/widgets/JournalsDashlet/export'),
  'menu-api': () => MenuApi,
  'journalsApi': () => journalsApi,
  'header': () => import('../../src/components/Header/export'),
  'slide-menu': () => import('../../src/components/Sidebar/export'),
  'user-in-groups-list-helper': () => import('../../src/helpers/export/userInGroupsHelper')
};
