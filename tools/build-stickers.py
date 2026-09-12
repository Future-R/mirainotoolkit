#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把本地表情包目录（默认 D:\\表情包）打包成「未来表情包」工具需要的静态资源。

产出：
    assets/stickers/full/<id>.webp    原图（等比缩放上限内、WebP 有损，保留透明通道）
    assets/stickers/thumb/<id>.webp   瀑布流缩略图
    js/sticker-data.js                window.STICKER_DATA 清单（目录 + 条目 + 关键字）

用法：
    python tools/build-stickers.py                     # 默认读 D:\\表情包
    python tools/build-stickers.py --root "D:\\某目录"
    python tools/build-stickers.py --dry-run           # 只打印统计，不写文件
    python tools/build-stickers.py --quality 95        # 提高原图画质（体积变大）

需要 Pillow：pip install pillow

设计要点：
    * 只读不写 —— 本脚本绝不修改源目录里的图片与 .meta。
    * 关键字解析规则与 D:\\表情包\\_manager\\sticker.py 完全一致，
      这样命令行 `python sticker.py index` 整理完序号后重新跑一次即可同步。
    * id = sha1(相对路径)[:12]，源文件改名/移动会得到新 id，属预期行为。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    print("缺少 Pillow，请先执行：pip install pillow", file=sys.stderr)
    raise SystemExit(2)


# --------------------------------------------------------------------------- #
# 常量
# --------------------------------------------------------------------------- #

DEFAULT_ROOT = r"D:\表情包"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".avif"}
META_SUFFIX = ".meta"
CACHE_DIRNAME = ".cache"

# 与 sticker.py 保持一致：识别为元数据的 key 不参与关键字
KEY_ALIASES = {
    "index": {"index", "序号", "order", "排序", "sort"},
    "file": {"file", "filename", "文件名", "name", "文件"},
    "engine": {"engine", "引擎", "source", "来源", "ocr"},
    "time": {"time", "created", "ocr_time", "识别时间", "时间", "date"},
    "size": {"size", "大小", "bytes"},
    "mtime": {"mtime", "修改时间"},
}
ALIAS2KEY = {alias: key for key, aliases in KEY_ALIASES.items() for alias in aliases}

KV_RE = re.compile(r"^\s*(?:#|//|;|\*)?\s*([^\s:：=]{1,16})\s*[:：=]\s*(.*)$")
NUM_RE = re.compile(r"(\d+)")


def natural_key(s: str):
    return [int(t) if t.isdigit() else t.lower() for t in NUM_RE.split(s)]


# --------------------------------------------------------------------------- #
# .meta 解析（与 sticker.py 同规则）
# --------------------------------------------------------------------------- #

def parse_meta(path: Path):
    """返回 (index, keywords, exists)。"""
    if not path.exists():
        return -1, [], False

    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        raw = ""

    index = -1
    keywords: list[str] = []
    for line in raw.splitlines():
        s = line.strip()
        if not s:
            continue
        kv = KV_RE.match(line)
        key = ALIAS2KEY.get(kv.group(1).strip().lower()) if kv else None
        if key == "index":
            digits = re.sub(r"[^\-\d]", "", kv.group(2))
            try:
                index = int(digits) if digits else -1
            except ValueError:
                index = -1
            continue
        if key in ("engine", "file", "time", "size", "mtime"):
            continue
        if s.startswith(("#", "//", ";", "*")):
            continue
        keywords.append(s)

    # 同一张图可能被 OCR 出重复行，去重但保持顺序
    seen = set()
    uniq = []
    for k in keywords:
        if k not in seen:
            seen.add(k)
            uniq.append(k)
    return index, uniq, True


# --------------------------------------------------------------------------- #
# 图片处理
# --------------------------------------------------------------------------- #

def load_rgb_or_rgba(src: Path) -> Image.Image:
    """读图并修正 EXIF 方向；有透明通道就保留，否则转 RGB。"""
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        has_alpha = im.mode in ("RGBA", "LA") or (
            im.mode == "P" and "transparency" in im.info
        )
        im = im.convert("RGBA" if has_alpha else "RGB")
        return im


def save_webp(im: Image.Image, dst: Path, *, quality: int, longest: int | None) -> None:
    out = im
    if longest:
        w, h = out.size
        if max(w, h) > longest:
            scale = longest / max(w, h)
            out = out.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(dst.suffix + ".tmp")
    out.save(tmp, "WEBP", quality=quality, method=5)
    os.replace(tmp, dst)


# --------------------------------------------------------------------------- #
# 主流程
# --------------------------------------------------------------------------- #

def collect(root: Path, full_longest: int, full_quality: int, thumb_longest: int,
            thumb_quality: int, force: bool, verbose: bool, dry: bool):
    items = []
    dir_set: dict[str, int] = {}

    for dirpath, dirnames, filenames in os.walk(root):
        cur = Path(dirpath)
        # 跳过隐藏目录 / 缓存；含 sticker.py 的目录是「表情包管理器」自身，也不算表情目录
        dirnames[:] = sorted(
            (d for d in dirnames
             if not d.startswith(".") and d not in (CACHE_DIRNAME, "__pycache__")
             and not (cur / d / "sticker.py").exists()),
            key=natural_key,
        )
        if (cur / "sticker.py").exists():
            continue

        for fn in sorted(filenames, key=natural_key):
            p = cur / fn
            if p.suffix.lower() not in IMAGE_EXTS:
                continue

            rel = p.relative_to(root).as_posix()
            d = Path(rel).parent.as_posix()
            d = "" if d == "." else d

            sid = hashlib.sha1(rel.encode("utf-8")).hexdigest()[:12]
            full_dst = ASSETS / "full" / f"{sid}.webp"
            thumb_dst = ASSETS / "thumb" / f"{sid}.webp"

            try:
                im = load_rgb_or_rgba(p)
            except Exception as exc:  # noqa: BLE001
                print(f"  [skip] 读图失败 {rel}: {exc}", file=sys.stderr)
                continue

            w, h = im.size
            if verbose:
                print(f"  {rel}  {w}x{h} -> {full_dst.name}")

            if not dry:
                if force or not full_dst.exists():
                    save_webp(im, full_dst, quality=full_quality, longest=full_longest)
                if force or not thumb_dst.exists():
                    save_webp(im, thumb_dst, quality=thumb_quality, longest=thumb_longest)

            index, keywords, has_meta = parse_meta(p.with_name(p.name + META_SUFFIX))

            items.append({
                "id": sid,
                "dir": d,
                "file": p.name,
                "index": index,
                "w": w,
                "h": h,
                "bytes": p.stat().st_size,
                "fullBytes": full_dst.stat().st_size if (not dry and full_dst.exists()) else 0,
                "kw": keywords,
                "scanned": has_meta,
            })
            dir_set[d] = dir_set.get(d, 0) + 1

    # 排序：目录（按自然序，空目录 = 全部在最后由前端处理）→ 序号 → 文件名
    items.sort(key=lambda it: (it["dir"], it["index"] if it["index"] > 0 else 10 ** 9,
                               natural_key(it["file"])))

    dirs = [{"name": name, "count": dir_set[name]}
            for name in sorted(dir_set, key=natural_key)]
    return items, dirs


def prune(keep_ids: set[str]) -> int:
    """删掉源目录里已经不存在的旧资源。"""
    removed = 0
    for sub in ("full", "thumb"):
        folder = ASSETS / sub
        if not folder.is_dir():
            continue
        for f in folder.iterdir():
            if f.suffix == ".webp" and f.stem not in keep_ids:
                f.unlink()
                removed += 1
    return removed


def write_manifest(items, dirs, root: Path, out: Path) -> None:
    payload = {
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": str(root),
        "dirs": dirs,
        "items": [
            {
                "id": it["id"],
                "d": it["dir"],
                "f": it["file"],
                "i": it["index"],
                "w": it["w"],
                "h": it["h"],
                "s": it["bytes"],
                "kw": it["kw"],
            }
            for it in items
        ],
    }
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "// 由 tools/build-stickers.py 自动生成，请勿手改。\n"
        f"// 源目录：{root}\n"
        f"// 生成时间：{payload['generatedAt']}\n"
        "// 重新生成：python tools/build-stickers.py\n"
        f"window.STICKER_DATA = {body};\n",
        encoding="utf-8",
    )


REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "assets" / "stickers"
MANIFEST = REPO / "js" / "sticker-data.js"


def main(argv=None) -> int:
    # Windows 控制台默认 GBK，中文/符号会炸，这里强制 UTF-8 输出
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    ap = argparse.ArgumentParser(description="打包表情包为静态资源 + 清单")
    ap.add_argument("--root", default=DEFAULT_ROOT, help=f"图片根目录（默认 {DEFAULT_ROOT}）")
    ap.add_argument("--full-longest", type=int, default=0,
                    help="原图最长边上限，0 = 不缩放（默认 0）")
    ap.add_argument("--quality", type=int, default=92, help="原图 WebP 质量（默认 92）")
    ap.add_argument("--thumb-longest", type=int, default=480, help="缩略图最长边（默认 480）")
    ap.add_argument("--thumb-quality", type=int, default=80, help="缩略图 WebP 质量（默认 80）")
    ap.add_argument("--force", action="store_true", help="已有资源也重新生成")
    ap.add_argument("--dry-run", action="store_true", help="只统计，不写文件")
    ap.add_argument("--verbose", action="store_true", help="逐个打印")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"根目录不存在：{root}", file=sys.stderr)
        return 1

    print(f"源目录：{root}")
    items, dirs = collect(root, args.full_longest, args.quality,
                          args.thumb_longest, args.thumb_quality,
                          args.force, args.verbose, args.dry_run)

    total_src = sum(it["bytes"] for it in items)
    no_kw = [it for it in items if not it["kw"]]
    neg = [it for it in items if it["index"] <= 0]

    print(f"目录 {len(dirs)} 个：" + "、".join(f"{d['name']}({d['count']})" for d in dirs))
    print(f"图片 {len(items)} 张，源文件共 {total_src / 1048576:.1f} MB")
    if neg:
        print(f"  · 序号 -1（未整理）{len(neg)} 张，会在列表末尾")
    if no_kw:
        print(f"  · 没有关键字 {len(no_kw)} 张")

    if args.dry_run:
        print("--dry-run：未写入任何文件")
        return 0

    kept = {it["id"] for it in items}
    removed = prune(kept)
    if removed:
        print(f"清理了 {removed} 个已失效资源")

    full_bytes = sum((ASSETS / "full" / f"{it['id']}.webp").stat().st_size for it in items)
    thumb_bytes = sum((ASSETS / "thumb" / f"{it['id']}.webp").stat().st_size for it in items)
    write_manifest(items, dirs, root, MANIFEST)

    print(f"原图资源 {full_bytes / 1048576:.1f} MB（{full_bytes / max(1, total_src) * 100:.0f}% 于源文件）")
    print(f"缩略图   {thumb_bytes / 1048576:.1f} MB")
    print(f"清单     {MANIFEST.relative_to(REPO)}  {MANIFEST.stat().st_size / 1024:.1f} KB")
    print("完成。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
