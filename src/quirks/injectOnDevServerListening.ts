import * as Webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';

export const injectOnDevServerListening = (
  config: Webpack.Configuration | Webpack.WebpackOptionsNormalized,
  listener: (server: WebpackDevServer) => void,
): void => {
  if (!config.devServer) {
    config.devServer = {};
  }
  const devServerConfig = config.devServer as WebpackDevServer.Configuration;

  const oldOnListening = devServerConfig.onListening;
  devServerConfig.onListening = devServer => {
    oldOnListening?.(devServer);

    listener(devServer);
  };
};
