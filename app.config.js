module.exports = ({ config }) => {
  const requestedBaseUrl = process.env.EXPO_BASE_URL?.trim();
  const baseUrl = requestedBaseUrl
    ? `/${requestedBaseUrl.replace(/^\/+|\/+$/g, '')}`
    : config.experiments?.baseUrl;

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
