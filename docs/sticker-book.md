# 未来表情包（`sticker-book`）

工具箱里的表情包浏览器：**只读**——浏览、筛选、复制，没有编辑、扫描、拖拽排序。

## 和 `D:\表情包\_manager` 的关系

`D:\表情包\_manager` 是本地那套「Python 服务 + 可编辑 `.meta`」的管理器（OCR 扫描、序号整理、
拖拽排序、网页改 meta）。本工具是它在**静态站点**里的只读镜像：

| | 本地管理器 | 本工具 |
| --- | --- | --- |
| 运行方式 | `python sticker.py serve`，本地 8731 端口 | 纯静态，直接跟着工具箱部署 |
| 图片 | 原图从磁盘实时读 | 同步时转成 WebP 存进 `assets/stickers/` |
| 元数据 | 运行时解析 `.meta` | 同步时解析成 `js/sticker-data.js` |
| 编辑 meta / OCR 扫描 / 拖拽排序 | 有 | **没有**（去源目录改，再 `npm run stickers`） |
| 浏览目录、关键字搜索、瀑布流、大图预览、复制 | 有 | 有 |

要改关键字或调序号，仍然去本地管理器里改；改完在仓库根目录跑一次 `npm run stickers` 即可同步。

## 数据管道

```
D:\表情包\爱染诚社长\xxx.png  +  xxx.png.meta
        │
        │  python tools/build-stickers.py       ← 增量同步，反复跑同一条即可
        ▼
assets/stickers/full/<id>.webp     原图（EXIF 摆正、保留透明通道、质量 92）
assets/stickers/thumb/<id>.webp    瀑布流缩略图（最长边 480）
assets/stickers/.sync.json         同步状态（源文件指纹），别手改
js/sticker-data.js                 window.STICKER_DATA 清单
```

`id = sha1(相对路径)[:12]`，所以源文件改名/挪目录会换一个新 id，旧资源会在下次同步时被清掉。

### 保持同步

在本地管理器里加图、改序号、改关键字之后，在仓库根目录跑一次就行：

```powershell
pip install pillow                     # 只依赖 Pillow
npm run stickers                       # = python tools/build-stickers.py
npm run stickers:watch                 # 常驻，源目录一变就自动同步
```

每次都会打印一份变化报告，例如：

```
源目录  D:\表情包
目录    喜多川穷哥 14、未分类 66、爱染诚社长 69、黎深牛 6
图片    155 张，源文件 58.7 MB
变化    新增 16、序号变化 10、关键字变化 1（未变 139 张，重新编码 16 张）
        + 黎深牛/OK.jpg
        序号 未分类/16BBC7ECBC...jpg：16 → 10
        关键字 未分类/B94CD17B4F...jpg：目前智力不足，针对这方面加强训练吧。 → 目前智力不足，请针对这方面加强训练吧。
清单    js/sticker-data.js 已更新
资源    原图 155 个 / 8.2 MB，缩略图 / 2.1 MB（源文件的 14%）
耗时    1.2s
```

判断「要不要重新生成」的规则：

| 情况 | 行为 |
| --- | --- |
| 指纹（size + mtime_ns）没变、资源也都在 | 直接复用，不解码不编码 |
| **同名文件被换了内容** | 指纹变了 → 重新生成（旧版本只看文件在不在，会漏掉这种） |
| 改了 `.meta` 的关键字 / 序号 | 不动图片，只重写清单 |
| 源目录删了图 | 对应资源被清理，状态里也删掉 |
| 清单内容一模一样 | 不重写文件，避免只改时间戳的无意义 diff |
| 有图没有 `.meta` / 序号是 -1 | 报告里会单独提醒 |

`--watch` 会每 3 秒（`--interval` 可调）比对一次源目录指纹，只在真的变了时才动手并打印报告。

| 参数 | 说明 |
| --- | --- |
| `--root DIR` | 图片根目录，默认 `D:\表情包` |
| `--quality N` | 原图 WebP 质量，默认 92 |
| `--full-longest N` | 原图最长边上限，默认 0（不缩放） |
| `--thumb-longest N` / `--thumb-quality N` | 缩略图最长边（默认 480）/ 质量（默认 80） |
| `--force` | 忽略缓存，全部重新生成 |
| `--dry-run` | 只打印变化，一个文件都不写 |
| `--verbose` | 逐个打印正在处理的图片 |
| `--watch` / `--interval N` | 常驻自动同步 / 轮询间隔秒数（默认 3） |

源目录里含 `sticker.py` 的文件夹（也就是 `_manager` 本身）、以 `.` 开头的目录、`.cache`、
`__pycache__` 都会被跳过；`.gif` 不在收录范围内。

> 换过 `--quality` / `--thumb-longest` 这类参数后要配 `--force`，否则指纹没变会被当成「无需重建」。

### 同步逻辑的自检

`tools/test-sync.py` 在一个临时沙箱仓库里跑完整流程，不碰真实资源和源库：

```powershell
npm run stickers:test
```

覆盖首次同步、幂等重跑、同名换内容、改关键字、改序号、删图清理、缺 `.meta` 提醒、
清单不空转等 15 项断言。

### `.meta` 解析规则

和 `sticker.py` 完全一致，所以两边永远读到同一份关键字：

* `index` / `序号` / `order` / `排序` / `sort`，冒号 `:` `：` `=` 都认，前缀 `#` `//` `;` `*` 可有可无。
* `file` / `engine` / `size` / `mtime` / `time` 这些行属于元数据，不算关键字。
* 其余以 `#`、`//`、`;`、`*` 开头的行是注释，不参与搜索。
* **剩下的每一行都是一个关键字**，搜索时匹配这些行（同时也匹配文件名和目录名）。

## 页面能做什么

* **左侧目录树**：`全部表情` 或单个目录；搜索时每个目录会显示各自的命中数，方便直接跳过去。
* **顶部搜索**：`目录 ∩ 关键字` 的交集筛选，命中处高亮；交集为空时提示「其它目录还有 N 张」。
* **瀑布流**：按清单里的原始尺寸算卡片高度，所以图片加载前布局就是稳的，不会跳动。
* **卡片**：序号徽标（`-1` 显示为橙色）、目录徽标（只在「全部表情」下显示）、文件名、关键字、`📋 复制`。
  **点图片本身就是看大图**，没有多余按钮。
* **大图预览**：左右翻页、复制、显示尺寸与原文件体积；`←` `→` 翻页，`Esc` 关闭。
* **复制**：仓库里存的是 WebP，浏览器只吃 PNG，所以复制时前端会先 canvas 转 PNG 再写剪贴板。
  剪贴板不可用时降级为复制关键字文字。
* 快捷键：`/` 聚焦搜索，`Esc` 清空搜索 / 关弹窗。

## 踩过的坑

### 浮层不能挂在页面 DOM 里

工具箱的 `.fade-in` 是 `animation: fadeIn .4s ease-out forwards`，`forwards` 会让
`transform: translateY(0)` **永久保留**在元素上。而任何非 `none` 的 `transform`（哪怕是
`matrix(1,0,0,1,0,0)` 这种单位矩阵）都会让该元素成为 `position: fixed` 的**包含块**。

结果就是：浮层如果写在页面 HTML 里，`inset: 0` 撑开的不是视口而是整个页面（这里高 8000+ px），
弹窗被「居中」到几屏之外——用户只看到一层铺满屏幕的黑色遮罩，以为卡住了。提示条同理，
永远不会出现在视口右下角。

所以 `#sb-lb` 和 `#sb-toasts` 是 `mount()` 时挂到 `document.body` 上的，并且用
`hashchange` 在离开本工具时自己收尸（`core.js` 没有 `destroy` 钩子）。

排查这类问题的快捷办法：从出问题的元素往上走，找第一个 `getComputedStyle(el).transform !== 'none'`
的祖先。

### 只改 hash 的导航不会重新加载文档

自检脚本因此会在 URL 上挂 `?e2e=时间戳`，否则改完 JS 再跑，测到的还是上一次的代码。

## 自检

`tools/e2e-stickers.js` 用 CDP 驱动无头浏览器跑一遍浏览、筛选、复制、大图预览（**在首/中/末
三个滚动位置各验一次弹窗确实落在视口内**）、首页入口、其它工具页回归和窄屏布局：

```powershell
node serve-local.js 8123
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --headless=new `
  --remote-debugging-port=9222 --user-data-dir="$env:TEMP\edge-sticker" about:blank
node tools/e2e-stickers.js 9222 http://127.0.0.1:8123/
```

## 体积

以 `D:\表情包` 的 155 张图（源文件 58.7 MB）为例：

| | 大小 |
| --- | --- |
| `assets/stickers/full` | 8.2 MB（源文件的 14%） |
| `assets/stickers/thumb` | 2.1 MB |
| `js/sticker-data.js` | 23 KB |
| `assets/stickers/.sync.json` | 23 KB |

这份资源是要提交进仓库的：纯静态站没有后端，跨源读不到本地磁盘上的图片，
不放进仓库就没法浏览、更没法复制。想彻底不引入这些二进制，只能放弃线上可用性、
改成本地起服务读 `D:\表情包` 的方案。
