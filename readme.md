# mihomo-override

它能够自动读取您现有的代理订阅，并动态生成一套包含**智能分流**、**自动测速**、**区域节点分组**和丰富**自定义规则**的全新配置。您无需手动编写复杂的配置文件，只需通过修改此脚本即可获得最佳代理体验。

## ✨ 核心功能

- **智能分流**: 自动识别并区分国内网站、被墙网站及其他国外网站，为它们选择最佳网络路径（直连或代理）。
- **自动节点分组**:
  - **区域分组**: 自动创建 `🇭🇰 HK AUTO`、`🇸🇬 SG AUTO`、`🇯🇵 JP AUTO`、`🇺🇸 US AUTO` 等区域测速分组。
  - **性价比分组**: 自动创建 `1倍便宜货` 分组，汇集所有低倍率节点。
  - **全局分组**: 自动创建 `AUTO` (所有节点自动测速) 和 `手动选择` 分组。
- **丰富的应用规则**: 内置对 AIGC、媒体、社交、开发等多种应用场景的精细化分流规则。
- **高度可定制**: 所有功能均可通过脚本顶部的“用户配置区”进行调整，包括图标、DNS、分流规则等。
- **DNS 优化**: 内置 DNS over TLS 和 DNS over HTTPS，有效防止 DNS 泄露，并为国内外域名智能解析。

## 🚀 快速上手

1.  **获取脚本**: 将 `mihomo.js` 文件中的所有代码复制。
2.  **配置覆写**:
    - 在支持 JavaScript 覆写的 Clash 客户端 (如 a-shell) 中，进入“覆写”或“预处理”设置。
    - 创建一个新的 JavaScript 覆写，将代码粘贴进去并保存。
3.  **应用覆写**: 在您的订阅配置上，启用刚刚创建的覆写脚本。
4.  **刷新订阅**: 更新您的订阅，新的配置将自动生成并生效。

## 🔧 自定义指南

所有自定义选项都集中在 `mihomo.js` 脚本顶部的 **“用户配置区”**。

### 场景一：我发现 `v2ex.com` 没走代理，想让它走代理

1.  打开 `mihomo.js` 文件。
2.  找到 `PROXY_RULES` 数组中的 `自定义代理` 对象。
3.  在 `payload` 数组中添加一行 `"DOMAIN-SUFFIX,v2ex.com"`。

```javascript
// ...
{
    name: "自定义代理", 
    preferProxy: true,
    payload: [
        "DOMAIN-SUFFIX,v2ex.com", // <-- 在这里添加
        "DOMAIN-SUFFIX,nodeseek.com"
    ],
    defaultProxy: "手动选择"
},
// ...
```

### 场景二：我想修改 `AIGC` 分组的默认节点为香港

1.  打开 `mihomo.js` 文件。
2.  找到 `PROXY_RULES` 数组中的 `AIGC` 对象。
3.  添加或修改 `defaultProxy` 属性为 `"HK AUTO"`。

```javascript
// ...
{
    name: "AIGC",
    preferProxy: true,
    urls: [ /* ... */ ],
    payload: [ /* ... */ ],
    defaultProxy: "HK AUTO" // <-- 在这里修改或添加
},
// ...
```

### 场景三：我想修改分组图标

1.  打开 `mihomo.js` 文件。
2.  找到 `GROUP_ICONS` 常量。
3.  修改对应分组名称的图标 URL 即可。

```javascript
const GROUP_ICONS = {
    // ...
    "AIGC": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bot.png",
    // ...
};
```

## ⚠️ 注意事项

-   **备份**: 在应用脚本前，建议备份您现有的配置文件。
-   **兼容性**: 此脚本专为 `mihomo` (Clash.Meta) 内核设计，可能不完全兼容其他 Clash 内核。
-   **规则更新**: 脚本中引用的在线规则集由第三方维护，会定期自动更新。

