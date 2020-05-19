import Ajax from './ajax';
import PopupManager from './popupManager';
import { t } from '../../../helpers/util';

export default {
  Ajax,
  PopupManager,
  message: (key, scope = 'global', options = {}) => t(key, options, scope)
};
