import { t } from '../../helpers/util';
import PopupManager from './popupManager';

export default {
  PopupManager,
  message: (key, scope = 'global', options = {}) => t(key, options, scope)
};
