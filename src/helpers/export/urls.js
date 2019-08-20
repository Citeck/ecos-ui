export const NEW_VERSION_PREFIX = '/v2';

export const isNewVersionPage = (link = window.location.pathname) => {
  return (link || '').includes(NEW_VERSION_PREFIX);
};
