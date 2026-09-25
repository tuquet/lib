# 🚀 @tuquet/extension-runner

> **Universal Isomorphic WebExtension Polyfill, Crash-Proof Mock Runtime & Headless Extension Bundler.**

[![npm version](https://img.shields.io/npm/v/@tuquet/extension-runner.svg)](https://www.npmjs.com/package/@tuquet/extension-runner)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](<>)
[![Type Checked](https://img.shields.io/badge/typescript-strict-blue.svg)](<>)
[![Tests](https://img.shields.io/badge/tests-7%2F7%20passing-brightgreen.svg)](<>)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Part of the **Tuquet Ecosystem** for enterprise-grade web automation, RPA orchestration, and distributed compute fleet management.

---

## 📖 Bối Cảnh & Vấn Đề Kỹ Thuật (Why This Library Exists?)

Trong các ứng dụng tự động hoá trình duyệt và Web Extensions hiện đại (như Automa, Studio, Canvas Flow), các kỹ sư thường gặp phải **2 bài toán nan giải**:

1. **Lỗi Crash StorageArea trên Chrome mới (v129+)**:
   Thư viện `webextension-polyfill` gốc từ Mozilla có cơ chế wrap `StorageArea` gây xung đột ngữ cảnh `this`, dẫn đến lỗi nghiêm trọng `Illegal invocation` hoặc `TypeError: Cannot read properties of undefined` trên các phiên bản Chromium gần đây.
2. **Khó khăn khi chia sẻ UI Components giữa Extension & Web Studio (Isomorphism)**:
   Khi muốn dùng chung Canvas Editor, Block Palette, hoặc Form cấu hình giữa **Bản Full Extension** và **Bản Nhẹ Web Studio (chạy ngoài browser/Storybook)**, mã nguồn thường xuyên bị crash do gọi trực tiếp vào `browser.storage.local`, `browser.runtime.*`, `browser.tabs.*` vốn không tồn tại trong môi trường Web thông thường.

👉 **`@tuquet/extension-runner` sinh ra để giải quyết dứt điểm 2 bài toán trên trong duy nhất 1 package tinh gọn.**

---

## ✨ Tính Năng Nổi Bật (Key Features)

- 🌐 **Zero-Config Isomorphism**: Tự động nhận diện ngữ cảnh đang chạy:
  - **Môi trường Extension (Chrome MV3 / Firefox)**: Kết nối trực tiếp native API không qua wrapper rườm rà.
  - **Môi trường Web / Webview / Node / Test**: Tự động kích hoạt **Crash-Proof Mock Runtime**.
- 🛡️ **Recursive Safe Proxy**: Bất kỳ API Chrome/Browser nào chưa được mock rõ ràng (ví dụ: `browser.cookies.getAll()`, `browser.contextMenus.create()`) đều được uỷ quyền qua Proxy và tự động trả về `Promise.resolve({})`, **tuyệt đối không bao giờ crash màn hình UI**.
- 💾 **Full In-Memory & LocalStorage State**: Triển khai đầy đủ chuẩn API `browser.storage.local` (`get`, `set`, `remove`, `clear`) và hệ thống thông báo thay đổi `storage.onChanged.addListener`.
- 📦 **Headless Runner Bundler Plugin**: Tích hợp sẵn Vite Plugin chuyên dụng giúp tự động bóc tách UI khỏi `manifest.json` và sinh scaffolding (`dummy.html`, `offscreen.html`, `sandbox.html`) cho các headless worker siêu nhẹ.
- 🪶 **Siêu nhẹ & Dual ESM/CJS**: Đóng gói chuẩn mực bằng `tsup`, hỗ trợ cả ECMAScript Modules (`.mjs`) lẫn CommonJS (`.cjs`), types `.d.ts` hoàn chỉnh.

---

## 📦 Cài Đặt (Installation)

```bash
# Using pnpm (Khuyến nghị trong Tuquet Ecosystem)
pnpm add @tuquet/extension-runner

# Using npm
npm install @tuquet/extension-runner

# Using yarn
yarn add @tuquet/extension-runner
```

---

## 🚀 Hướng Dẫn Sử Dụng (Usage Guide)

### 1. Sử dụng Polyfill Isomorphic trong Vue 3 / TypeScript

Import trực tiếp đối tượng `browser` chuẩn:

```typescript
import browser, { isExtensionEnv, isWebEnv } from '@tuquet/extension-runner';

// 1. Kiểm tra môi trường đang chạy
if (isExtensionEnv()) {
  console.log('Đang chạy bên trong Chrome Extension!');
} else {
  console.log('Đang chạy trên Web Studio / Storybook!');
}

// 2. Thao tác với Storage API an toàn trên CẢ HAI môi trường
async function saveWorkflow(workflow: any) {
  await browser.storage.local.set({
    [`workflow_${workflow.id}`]: workflow,
  });
}

async function loadWorkflow(workflowId: string) {
  const result = await browser.storage.local.get(`workflow_${workflowId}`);
  return result[`workflow_${workflowId}`];
}

// 3. Gọi các API chưa mock mà không sợ crash UI
await browser.cookies.getAll({}); // Trả về Promise an toàn, không ném ngoại lệ!
```

---

### 2. Lắng nghe sự kiện thay đổi dữ liệu (`onChanged`)

```typescript
import browser from '@tuquet/extension-runner';

// Lắng nghe realtime khi có biến hoặc workflow mới được lưu
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.activeWorkflow) {
    console.log('Workflow vừa đổi thành:', changes.activeWorkflow.newValue);
  }
});
```

---

### 3. Cấu hình Vite Plugin đóng gói Headless Runner (`tuquetRunnerPlugin`)

Khi xây dựng một Extension Runner chạy ngầm (không cần giao diện popup/options, chỉ cần worker offscreen chạy automation):

```typescript
// vite.runner.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { tuquetRunnerPlugin } from '@tuquet/extension-runner';

export default defineConfig({
  plugins: [
    vue(),
    tuquetRunnerPlugin({
      manifestPath: './src/manifest.chrome.json',
      name: 'Tuquet Headless Automation Runner',
      version: '1.2.0',
      offscreenScript: './offscreen.bundle.js',
      sandboxScript: './sandbox.bundle.js',
    }),
  ],
  build: {
    outDir: 'dist/cli-runner',
  },
});
```

**Plugin sẽ tự động:**

1. Đọc `manifest.chrome.json`, bóc tách các trường UI (`action`, `options_ui`, `chrome_url_overrides`).
2. Sinh file `manifest.json` tối giản vào thư mục `dist`.
3. Sinh `dummy.html`, `offscreen.html`, `sandbox.html` sẵn sàng cho Chrome nạp làm worker.

---

### 4. Sử dụng trong Unit Test (Vitest / Jest)

Tạo mock storage độc lập cho từng test case:

```typescript
import { describe, it, expect } from 'vitest';
import { createBrowserMock, InMemoryStorageArea } from '@tuquet/extension-runner';

describe('Workflow Service Tests', () => {
  it('should isolate storage between tests', async () => {
    const mock = createBrowserMock({ sampleToken: 'secret_abc' });

    const res = await mock.storage.local.get('sampleToken');
    expect(res.sampleToken).toBe('secret_abc');
  });
});
```

---

## 📊 So Sánh: `@tuquet/extension-runner` vs `webextension-polyfill`

| Tiêu Chí                              | `webextension-polyfill` (Mozilla)                     | `@tuquet/extension-runner` (Tuquet)                |
| :------------------------------------ | :---------------------------------------------------- | :------------------------------------------------- |
| **Hỗ trợ Chrome MV3 mới (v129+)**     | ❌ Dễ crash StorageArea do lỗi binding context        | ✅ Hoạt động 100% mượt mà với native `chrome.*`    |
| **Chạy ngoài Extension (Web Studio)** | ❌ Ném ngoại lệ `Cannot read properties of undefined` | ✅ Tự động kích hoạt **Recursive Safe Proxy Mock** |
| **Crash-Proof Guarantee**             | ❌ Crash khi gọi API không được định nghĩa            | ✅ Không bao giờ crash, luôn fallback an toàn      |
| **Công cụ đóng gói Runner (Vite)**    | ❌ Không hỗ trợ                                       | ✅ Tích hợp sẵn `tuquetRunnerPlugin` cho Headless  |
| **Độ phụ thuộc (Dependencies)**       | Cồng kềnh                                             | 🪶 **Zero runtime dependencies**                   |

---

## 🔧 API Reference

### Exports chính từ `@tuquet/extension-runner`:

| Tên Export                    | Kiểu (Type)         | Mô Tả                                                                    |
| :---------------------------- | :------------------ | :----------------------------------------------------------------------- |
| `default` / `browser`         | `any`               | Đối tượng tương thích API trình duyệt (Isomorphic instance).             |
| `isExtensionEnv()`            | `() => boolean`     | Trả về `true` nếu đang chạy trong extension Chrome/Edge/Firefox thực tế. |
| `isWebEnv()`                  | `() => boolean`     | Trả về `true` nếu đang chạy trên web browser / webview / node / studio.  |
| `createBrowserMock(initial?)` | `(data?) => any`    | Factory tạo instance mock hoàn chỉnh với Safe Proxy đệ quy.              |
| `InMemoryStorageArea`         | `class`             | Lớp mô phỏng bộ nhớ lưu trữ `browser.storage.local`.                     |
| `tuquetRunnerPlugin(options)` | `(opts?) => Plugin` | Vite plugin đóng gói headless extension runner.                          |

---

## 📜 Giấy Phép (License)

Phát hành dưới giấy phép [MIT License](LICENSE) © 2026 [Tuquet Ecosystem](https://github.com/tuquet).
