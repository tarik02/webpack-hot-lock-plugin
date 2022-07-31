import * as FS from 'node:fs';
import * as Path from 'node:path';
import Webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { injectOnDevServerListening } from './quirks/injectOnDevServerListening.js';

export type Options = {
  name?: string;
  transform?: (data: Record<string, any>, context: {
    compiler: Webpack.Compiler,
    devServer: WebpackDevServer,
  }) => void;
};

export default class WebpackHotLockPlugin {
  constructor(private options: Options = {}) {
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      name = 'hot.json',
    } = this.options;

    injectOnDevServerListening(compiler.options, async devServer => {
      if (!devServer.server) {
        return;
      }

      const hostname = await WebpackDevServer.getHostname(devServer.options.host ?? 'local-ip')
      const address = devServer.server.address()!;

      const isHTTPS = devServer.options.server === 'https'
        || (typeof devServer.options.server === 'object' && devServer.options.server.type === 'https')
        || !!devServer.options.https;

      const baseUri = `${ isHTTPS ? 'https' : 'http' }://${hostname}:${(address as any).port}/`;
      const lockData = {
        pid: process.pid,
        baseUri,
      };

      this.options.transform?.(lockData, {
        compiler,
        devServer,
      });

      const hotFile = Path.resolve(compiler.outputPath, name);

      const createLockfile = async () => {
        await FS.promises.mkdir(
          Path.dirname(hotFile),
          { recursive: true },
        );
        await FS.promises.writeFile(
          hotFile,
          JSON.stringify(lockData, undefined, 2),
        );
      };

      const removeLockfileSync = () => {
        if (FS.statSync(hotFile, { throwIfNoEntry: false })) {
          FS.rmSync(
            hotFile,
          );
        }
      };

      const closeListener = () => {
        devServer.server?.off('close', closeListener);
        process.removeListener('SIGINT', closeListener);
        process.removeListener('SIGTERM', closeListener);

        removeLockfileSync();
      };

      devServer.server?.on('close', closeListener);
      process.addListener('SIGINT', closeListener);
      process.addListener('SIGTERM', closeListener);

      await createLockfile();
    });
  }
}
