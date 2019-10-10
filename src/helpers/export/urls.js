export const NEW_VERSION_PREFIX = '/v2';

export const isNewVersionPage = (link = window.location.pathname) => {
  return (link || '').includes(NEW_VERSION_PREFIX);
};

export const isNewVersionSharePage = (link = window.location.pathname) => {
  return /share\/.+-page-v2.*/.test(link || '');
};
