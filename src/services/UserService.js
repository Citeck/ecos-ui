import { createThumbnailUrl } from '../helpers/urls';

export default class UserService {
  /**
   * @param url
   * @param props - extra for url
   * @return {string} correct avatar url. Use all props
   */
  static getAvatarUrl(url, props) {
    return createThumbnailUrl(url, { ...props });
  }
}
