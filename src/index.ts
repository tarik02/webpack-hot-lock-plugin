import * as FS from 'node:fs';
import * as Path from 'node:path';
import * as HTTP from 'node:http';
import Webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { injectOnDevServerListening } from './quirks/injectOnDevServerListening.js';

export type Options = {
  name?: string;
  gitignore?: boolean;
  socket?: boolean | string;
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
      gitignore = false,
      socket = true,
      transform,
    } = this.options;

    injectOnDevServerListening(compiler.options, async devServer => {
      if (!devServer.server) {
        return;
      }

      const hotFile = Path.resolve(compiler.outputPath, name);

      const socketData = await (async () => {
        if (socket === false) {
          return null;
        }

        const path = socket === true ?
          Path.resolve(Path.dirname(hotFile), `${ Path.basename(hotFile, Path.extname(hotFile)) }.sock`) :
          Path.resolve(compiler.outputPath, hotFile);

        try {
          await FS.promises.rm(path);
        } catch (e: any) {
          if (e.code !== 'ENOENT') {
            throw e;
          }
        }

        const server = HTTP.createServer(devServer.app);

        new Promise<void>(resolve => {
          server.listen(path, resolve);
        });

        return { path, server };
      })();

      const hostname = await WebpackDevServer.getHostname(devServer.options.host ?? 'local-ip')
      const address = devServer.server.address()!;

      const isHTTPS = devServer.options.server === 'https'
        || (typeof devServer.options.server === 'object' && devServer.options.server.type === 'https')
        || !!devServer.options.https;

      const baseUri = `${ isHTTPS ? 'https' : 'http' }://${hostname}:${(address as any).port}/`;
      const lockData = {
        pid: process.pid,
        baseUri,
        socket: socketData
          ? Path.relative(Path.dirname(hotFile), socketData.path)
          : undefined,
      };

      transform?.(lockData, {
        compiler,
        devServer,
      });

      const createLockfile = async () => {
        await FS.promises.mkdir(
          Path.dirname(hotFile),
          { recursive: true },
        );
        await FS.promises.writeFile(
          Path.join(Path.dirname(hotFile), '.gitignore'),
          [
            Path.basename(hotFile),
            ...socketData
              ? Path.basename(socketData.path)
              : [],
            '.gitignore',
            '',
          ].join('\n')
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

        if (
          gitignore &&
          FS.statSync(Path.join(Path.dirname(hotFile), '.gitignore'), { throwIfNoEntry: false })
        ) {
          FS.rmSync(
            Path.join(Path.dirname(hotFile), '.gitignore'),
          );
        }

        if (socketData && FS.statSync(socketData.path, { throwIfNoEntry: false })) {
          FS.rmSync(socketData.path);
          socketData.server.close();
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
