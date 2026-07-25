const appConfig = require("./app.config.json");

module.exports = ({ config }) => {
  const expoConfig = appConfig.expo;

  return {
    ...expoConfig,
    android: {
      ...expoConfig.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
  };
};
