# 未来表情包（`sticker-book`）

工具箱里的表情包浏览器：**只读**——浏览、筛选、复制，没有编辑、扫描、拖拽排序。

## 和 `D:\表情包\_manager` 的关系

`D:\表情包\_manager` 是本地那套「Python 服务 + 可编辑 `.meta`」的管理器（OCR 扫描、序号整理、
拖拽排序、网页改 meta）。本工具是它在**静态站点**里的只读镜像：

| | 本地管理器 | 本工具 |
| --- | --- | --- |
| 运行方式 | `python sticker.py serve`，本地 8731 端口 | 纯静态，直接跟着工具箱部署 |
| 图片 | 原图从磁盘实时读 | 构建时转成 WebP 存进 `assets/stickers/` |
| 元数据 | 运行时解析 `.meta` | 构建时解析成 `js/sticker-data.js` |
| 编辑 meta / OCR 扫描 / 拖拽排序 | 有 | **没有**（去源目录改，再重新构建） |
| 浏览目录、关键字搜索、瀑布流、大图预览、复制 | 有 | 有 |

要改关键字或调序号，仍然去本地管理器里改；改完在仓库根目录重新跑一次构建脚本即可同步。

## 数据管道

```
D:\表情包\爱染诚社长\xxx.png  +  xxx.png.meta
        │
        │  python tools/build-stickers.py
        ▼
assets/stickers/full/<id>.webp     原图（EXIF 摆正、保留透明通道、质量 92）
assets/stickers/thumb/<id>.webp    瀑布流缩略图（最长边 480）
js/sticker-data.js                 window.STICKER_DATA 清单
```

`id = sha1(相对路径)[:12]`，所以源文件改名/挪目录会换一个新 id，旧资源会在下次构建时被清掉。

### 重新生成

```powershell
pip install pillow                      # 只依赖 Pillow
python tools/build-stickers.py          # 默认读 D:\表情包
python tools/build-stickers.py --root "D:\别的地方\表情包"
python tools/build-stickers.py --dry-run --verbose   # 只看统计，不写文件
python tools/build-stickers.py --quality 95 --thumb-longest 640
```

| 参数 | 说明 |
| --- | --- |
| `--root DIR` | 图片根目录，默认 `D:\表情包` |
| `--quality N` | 原图 WebP 质量，默认 92 |
| `--full-longest N` | 原图最长边上限，默认 0（不缩放） |
| `--thumb-longest N` / `--thumb-quality N` | 缩略图最长边（默认 480）/ 质量（默认 80） |
| `--force` | 已有资源也重新生成 |
| `--dry-run` | 只统计，一个文件都不写 |

源目录里含 `sticker.py` 的文件夹（也就是 `_manager` 本身）、以 `.` 开头的目录、`.cache`、
`__pycache__` 都会被跳过；`.gif` 不在收录范围内。

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
* **卡片**：序号徽标（`-1` 显示为橙色）、目录徽标（只在「全部表情」下显示）、文件名、关键字、复制、大图。
* **大图预览**：左右翻页、复制、显示尺寸与原文件体积；`←` `→` 翻页，`Esc` 关闭。
* **复制**：仓库里存的是 WebP，浏览器只吃 PNG，所以复制时前端会先 canvas 转 PNG 再写剪贴板。
  剪贴板不可用时降级为复制关键字文字。
* 快捷键：`/` 聚焦搜索，`Esc` 清空搜索 / 关弹窗。

## 自检

`tools/e2e-stickers.js` 用 CDP 驱动无头浏览器跑一遍浏览、筛选、复制、大图预览、首页入口、
其它工具页回归和窄屏布局：

```powershell
node serve-local.js 8123
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --headless=new `
  --remote-debugging-port=9222 --user-data-dir="$env:TEMP\edge-sticker" about:blank
node tools/e2e-stickers.js 9222 http://127.0.0.1:8123/
```

> 注意：只改 `#hash` 的导航不会重新加载文档，脚本因此会在 URL 上挂一个 `?e2e=时间戳`，
> 否则测到的可能还是上一次的 JS。

## 体积

以 `D:\表情包` 的 139 张图（源文件 57.9 MB）为例：

| | 大小 |
| --- | --- |
| `assets/stickers/full` | 7.8 MB（源文件的 14%） |
| `assets/stickers/thumb` | 2.0 MB |
| `js/sticker-data.js` | 22.9 KB |

这份资源是要提交进仓库的：纯静态站没有后端，跨源读不到本地磁盘上的图片，
不放进仓库就没法浏览、更没法复制。想彻底不引入这些二进制，只能放弃线上可用性、
改成本地起服务读 `D:\表情包` 的方案。
