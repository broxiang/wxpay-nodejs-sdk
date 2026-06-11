import { describe, it, expect } from 'vitest';
import * as sdk from '../src/index.js';

/**
 * API Surface 快照测试
 *
 * 捕获 SDK 公共 API 的完整表面：导出的类、函数、类型。
 * 任何意外的 API 变更（新增、删除、重命名）都会导致快照失败，
 * 从而在发布前发现 breaking change。
 */
describe('API Surface', () => {
  it('公共导出符号快照', () => {
    const exports = Object.keys(sdk).sort();
    expect(exports).toMatchSnapshot();
  });

  it('类导出的方法快照', () => {
    const classExports: Record<string, string[]> = {};

    for (const [name, value] of Object.entries(sdk)) {
      if (
        typeof value === 'function' &&
        value.prototype &&
        value.prototype !== Function.prototype
      ) {
        const methods = Object.getOwnPropertyNames(value.prototype)
          .filter((m) => m !== 'constructor')
          .sort();
        classExports[name] = methods;
      }
    }

    expect(classExports).toMatchSnapshot();
  });

  it('函数导出快照', () => {
    const functionExports: string[] = [];

    for (const [name, value] of Object.entries(sdk)) {
      if (
        typeof value === 'function' &&
        (!value.prototype || value.prototype === Function.prototype)
      ) {
        functionExports.push(name);
      }
    }

    expect(functionExports.sort()).toMatchSnapshot();
  });
});
