import { describe, expect, it } from 'vitest';
import browser, {
  createBrowserMock,
  isExtensionEnv,
  isWebEnv,
  InMemoryStorageArea,
  tuquetRunnerPlugin,
} from '../src/index.js';

describe('@tuquet/extension-runner polyfill & mock', () => {
  it('should detect web environment by default in Node/test context', () => {
    expect(isWebEnv()).toBe(true);
    expect(isExtensionEnv()).toBe(false);
  });

  it('should export a valid browser instance', () => {
    expect(browser).toBeDefined();
    expect(browser.storage).toBeDefined();
    expect(browser.storage.local).toBeDefined();
    expect(browser.runtime).toBeDefined();
    expect(browser.runtime.id).toBe('mock-tuquet-extension-id');
  });

  it('should store and retrieve data in mock storage area', async () => {
    const storage = new InMemoryStorageArea({ foo: 'initial' });

    // 1. Get initial
    const initRes = await storage.get('foo');
    expect(initRes.foo).toBe('initial');

    // 2. Set new key
    await storage.set({ bar: 123 });
    const fullRes = await storage.get();
    expect(fullRes.foo).toBe('initial');
    expect(fullRes.bar).toBe(123);

    // 3. Remove key
    await storage.remove('foo');
    const afterRemove = await storage.get('foo');
    expect(afterRemove.foo).toBeNull();
  });

  it('should notify onChanged listeners on storage.set', async () => {
    const storage = new InMemoryStorageArea();
    let changeNotified = false;

    storage.onChanged.addListener((changes: any, area: string) => {
      if (changes.token && area === 'local') {
        changeNotified = true;
      }
    });

    await storage.set({ token: 'secret-123' });
    expect(changeNotified).toBe(true);
  });

  it('should never crash on arbitrary unmocked browser APIs (Recursive Safe Proxy)', async () => {
    const mock = createBrowserMock();

    // Calling deeply nested unknown APIs
    expect(() => mock.cookies.getAll()).not.toThrow();
    expect(() => mock.devtools.inspectedWindow.eval('1+1')).not.toThrow();
    expect(() => mock.contextMenus.create({ id: 'menu' })).not.toThrow();

    const res = await mock.anyUnknownService.deeply.nested.action();
    expect(res).toBeDefined();
  });
});

describe('@tuquet/extension-runner bundler plugin', () => {
  it('should instantiate tuquetRunnerPlugin', () => {
    const plugin = tuquetRunnerPlugin({
      name: 'Custom Runner',
      version: '2.0.0',
    });

    expect(plugin.name).toBe('tuquet-extension-runner-plugin');
    expect(typeof (plugin as any).generateBundle).toBe('function');
  });

  it('should emit dummy, offscreen, and sandbox files during generateBundle', () => {
    const plugin = tuquetRunnerPlugin();
    const emittedFiles: any[] = [];

    const mockContext = {
      emitFile: (file: any) => {
        emittedFiles.push(file);
      },
    };

    (plugin as any).generateBundle.call(mockContext);

    const fileNames = emittedFiles.map((f) => f.fileName);
    expect(fileNames).toContain('dummy.html');
    expect(fileNames).toContain('offscreen.html');
    expect(fileNames).toContain('sandbox.html');
  });
});
