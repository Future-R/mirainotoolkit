# 未来聊网页版

未来聊在工具箱的 `./chat/` 独立页面运行，PC 和手机使用同一地址。GitHub Pages 会随 `main` 分支根目录发布 `chat/`，其中只有网页构建产物和 MIT 许可证。源码在独立的 `mirai-chat` 仓库。

## 更新网页

先将 `mirai-chat` 检出到要发布的版本，然后在工具箱目录运行以下命令。需要 Node.js 24 和 pnpm 12，默认从同级的 `mirai-chat` 目录构建。

```sh
pnpm chat:update
```

源码在其他目录时，将其路径作为参数传入，例如 `pnpm chat:update ../other/mirai-chat`。更新后可用 `pnpm dev` 本地检查 `/chat/`，然后将生成的 `chat/` 提交到工具箱的 `main` 分支。

## 会话和同步

会话保存在浏览器的 IndexedDB 中，模型设置和 API Key 也保存在本机浏览器。浏览器按站点来源（协议、域名和端口）保存这些数据。换设备、浏览器或站点来源时，可在原来使用的未来聊导出会话，再到新页面导入。导入会替换新页面的已有会话，模型 API Key 需要重新配置。

GitHub Pages 提供静态网页。坚果云自动同步需要未来聊的原生客户端或其本地开发服务。
