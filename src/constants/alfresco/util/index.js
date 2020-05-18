import { t } from '../../../helpers/util';
import PopupManager from './popupManager';
import Ajax from './ajax';

export default {
  Ajax,
  PopupManager,
  message: (key, scope = 'global', options = {}) => t(key, options, scope)
};
