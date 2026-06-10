export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构（既非新功能也非修复）
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建/工具/依赖
        'ci',       // CI 配置
        'revert',   // 回退
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
  },
};
