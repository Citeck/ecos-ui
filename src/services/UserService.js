import { createThumbnailUrl } from '../helpers/urls';

export default class UserService {
  /**
   * @param ref
   * @param modified - use to exclude deprecated img from cache
   * @param props - extra for url
   * @return {string} correct avatar url. Use all props
   */
  static getAvatarUrl(ref, modified, props) {
    return createThumbnailUrl(ref, { t: modified, ...props });
  }
}
