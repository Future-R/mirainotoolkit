#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把本地表情包目录（默认 D:\\表情包）增量同步成「未来表情包」需要的静态资源。

它既是构建脚本，也是同步脚本：反复跑同一条命令即可，只处理发生变化的部分。

    assets/stickers/full/<id>.webp    原图（WebP 有损，保留透明通道）
    assets/stickers/thumb/<id>.webp   瀑布流缩略图
    assets/stickers/.sync.json        同步状态（源文件指纹），别手改
    js/sticker-data.js                window.STICKER_DATA 清单

用法：
    python tools/build-stickers.py               # 同步一次，并打印变化报告
    python tools/build-stickers.py --watch       # 常驻，源目录一变就自动同步
    python tools/build-stickers.py --dry-run     # 只看会发生什么，不写任何文件
    python tools/build-stickers.py --force       # 忽略缓存，全部重新生成

需要 Pillow：pip install pillow

怎么判断「需要重新生成」：
    * 记 size + mtime_ns 指纹；指纹没变且资源文件都在 → 直接复用，不做解码/编码。
    * 换了图但文件重名 → size/mtime 变了 → 会重新生成（旧版本只看文件在不在，这里修掉了）。
    * 改了 .meta 的关键字/序号 → 不用动图片，只重写清单。
    * 源目录删了图 → 对应资源会被清理。
    * 清单一模一样时不会重写，避免只改时间戳的无意义 diff。

只读不写：本脚本绝不修改源目录里的图片与 .meta。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
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

REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "assets" / "stickers"
MANIFEST = REPO / "js" / "sticker-data.js"
STATE = ASSETS / ".sync.json"

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
# 扫描源目录
# --------------------------------------------------------------------------- #

def scan_source(root: Path):
    """走一遍源目录，返回 (entries, dirs)。只看文件属性，不解码图片。"""
    entries = []
    dir_count: dict[str, int] = {}

    for dirpath, dirnames, filenames in os.walk(root):
        cur = Path(dirpath)
        # 跳过隐藏目录 / 缓存；含 sticker.py 的目录是「表情包管理器」自身，不算表情目录
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

            try:
                st = p.stat()
            except OSError:
                continue

            meta = p.with_name(p.name + META_SUFFIX)
            try:
                mst = meta.stat()
                meta_sig = [mst.st_size, mst.st_mtime_ns]
            except OSError:
                meta_sig = None

            index, keywords, has_meta = parse_meta(meta)

            entries.append({
                "id": hashlib.sha1(rel.encode("utf-8")).hexdigest()[:12],
                "src": rel,
                "dir": d,
                "file": p.name,
                "path": p,
                "size": st.st_size,
                "mtime": st.st_mtime_ns,
                "meta_sig": meta_sig,
                "index": index,
                "kw": keywords,
                "has_meta": has_meta,
                "w": 0,
                "h": 0,
            })
            dir_count[d] = dir_count.get(d, 0) + 1

    entries.sort(key=lambda e: (e["dir"], e["index"] if e["index"] > 0 else 10 ** 9,
                                natural_key(e["file"])))
    dirs = [{"name": n, "count": dir_count[n]} for n in sorted(dir_count, key=natural_key)]
    return entries, dirs


def source_fingerprint(entries) -> tuple:
    """源目录的轻量指纹，watch 模式用它判断要不要动手。"""
    return tuple(sorted(
        (e["src"], e["size"], e["mtime"], tuple(e["meta_sig"] or ()))
        for e in entries
    ))


# --------------------------------------------------------------------------- #
# 状态 / 清单读写
# --------------------------------------------------------------------------- #

def load_state() -> dict:
    try:
        data = json.loads(STATE.read_text(encoding="utf-8"))
        if isinstance(data, dict) and isinstance(data.get("entries"), dict):
            return data
    except (OSError, ValueError):
        pass
    return {"version": 1, "entries": {}}


def save_state(state: dict) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, STATE)


def load_manifest() -> dict | None:
    """读出上一次生成的清单（用于变化报告 / 增量判断）。"""
    try:
        raw = MANIFEST.read_text(encoding="utf-8")
        payload = json.loads(raw[raw.index("{"):raw.rindex(";")])
        if isinstance(payload.get("items"), list):
            return payload
    except (OSError, ValueError):
        pass
    return None


def build_payload(entries, dirs, root: Path) -> dict:
    return {
        "source": str(root),
        "dirs": dirs,
        "items": [
            {
                "id": e["id"],
                "d": e["dir"],
                "f": e["file"],
                "i": e["index"],
                "w": e["w"],
                "h": e["h"],
                "s": e["size"],
                "kw": e["kw"],
            }
            for e in entries
        ],
    }


def write_manifest(payload: dict, root: Path) -> None:
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    full = {"generatedAt": stamp, **payload}
    body = json.dumps(full, ensure_ascii=False, separators=(",", ":"))
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        "// 由 tools/build-stickers.py 自动生成，请勿手改。\n"
        f"// 源目录：{root}\n"
        f"// 生成时间：{stamp}\n"
        "// 重新生成：python tools/build-stickers.py\n"
        f"window.STICKER_DATA = {body};\n",
        encoding="utf-8",
    )


# --------------------------------------------------------------------------- #
# 同步主流程
# --------------------------------------------------------------------------- #

def prune_assets(keep_ids: set) -> int:
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


def sync_once(root: Path, args) -> dict:
    """跑一次同步。返回统计信息（调用方负责打印）。"""
    prev = load_manifest()
    state = load_state()
    prev_entries = {it["id"]: it for it in (prev or {}).get("items", [])}

    entries, dirs = scan_source(root)

    added, updated, seeded, unchanged, regen = [], [], [], 0, 0
    failed = []

    for e in entries:
        sid = e["id"]
        sig = [e["size"], e["mtime"]]
        full_dst = ASSETS / "full" / f"{sid}.webp"
        thumb_dst = ASSETS / "thumb" / f"{sid}.webp"

        remembered = state["entries"].get(sid)
        assets_ok = full_dst.exists() and thumb_dst.exists()

        if args.force:
            need = True
        elif not assets_ok:
            need = True
        elif remembered and remembered.get("sig") == sig:
            need = False          # 指纹一致，图也都在，放心复用
        elif not remembered:
            # 老版本没有状态文件：清单里的原始体积能对上就认为资源是新的，
            # 免得升级后第一次跑就把一百多张图全部重新编码一遍。
            old = prev_entries.get(sid)
            if old and old.get("s") == e["size"] and old.get("f") == e["file"]:
                seeded.append(e)
                need = False
            else:
                need = True
        else:
            need = True           # 同路径但内容变了

        if need:
            try:
                im = load_rgb_or_rgba(e["path"])
            except Exception as exc:  # noqa: BLE001
                failed.append((e["src"], str(exc)))
                continue
            e["w"], e["h"] = im.size
            if not args.dry_run:
                save_webp(im, full_dst, quality=args.quality, longest=args.full_longest)
                save_webp(im, thumb_dst, quality=args.thumb_quality,
                          longest=args.thumb_longest)
            regen += 1
            if sid in prev_entries:
                updated.append(e)
            else:
                added.append(e)
            if args.verbose:
                print(f"    · 生成 {e['src']}  {e['w']}x{e['h']}")
            state["entries"][sid] = {"src": e["src"], "sig": sig}
        else:
            unchanged += 1
            # 尺寸从旧清单里捡回来，省一次解码
            old = prev_entries.get(sid)
            if old:
                e["w"], e["h"] = old.get("w", 0), old.get("h", 0)
            state["entries"][sid] = {"src": e["src"], "sig": sig}

    # 尺寸来源缺失（例如清单被删）时补一次解码，保证瀑布流比例正确
    for e in entries:
        if not e["w"] or not e["h"]:
            try:
                with Image.open(e["path"]) as im:
                    e["w"], e["h"] = im.size
            except Exception:  # noqa: BLE001
                e["w"], e["h"] = 0, 0

    keep = {e["id"] for e in entries}
    gone = [sid for sid in state["entries"] if sid not in keep]
    for sid in gone:
        state["entries"].pop(sid, None)
    # 报告里按「图片张数」算，不是被删掉的 webp 文件数（一张图有原图 + 缩略图两个），
    # 这样 --dry-run 与实际执行的数字才一致。
    if not args.dry_run:
        prune_assets(keep)

    payload = build_payload(entries, dirs, root)
    prev_payload = None
    if prev:
        prev_payload = {k: v for k, v in prev.items() if k != "generatedAt"}

    manifest_changed = prev_payload != payload
    if manifest_changed and not args.dry_run:
        write_manifest(payload, root)

    if not args.dry_run:
        save_state(state)

    # 关键字 / 序号变化（按 id 比对，改名会体现为「新增 + 移除」）
    kw_changed, idx_changed = [], []
    for e in entries:
        old = prev_entries.get(e["id"])
        if not old:
            continue
        if old.get("i") != e["index"]:
            idx_changed.append((e, old.get("i")))
        if (old.get("kw") or []) != e["kw"]:
            kw_changed.append((e, old.get("kw") or []))

    return {
        "entries": entries, "dirs": dirs,
        "added": added, "updated": updated, "removed": len(gone),
        "unchanged": unchanged, "regen": regen, "seeded": seeded,
        "failed": failed, "manifest_changed": manifest_changed,
        "manifest_new": prev is None,
        "kw_changed": kw_changed, "idx_changed": idx_changed,
        "prev_total": len(prev_entries),
    }


def report(r: dict, root: Path, args) -> None:
    entries = r["entries"]
    total_src = sum(e["size"] for e in entries)
    no_meta = [e for e in entries if not e["has_meta"]]
    unnumbered = [e for e in entries if e["index"] <= 0]

    print(f"源目录  {root}")
    print("目录    " + "、".join(f"{d['name']} {d['count']}" for d in r["dirs"]))
    print(f"图片    {len(entries)} 张，源文件 {total_src / 1048576:.1f} MB")

    head = []
    if r["added"]:
        head.append(f"新增 {len(r['added'])}")
    if r["updated"]:
        head.append(f"图片更新 {len(r['updated'])}")
    if r["removed"]:
        head.append(f"移除 {r['removed']}")
    if r["idx_changed"]:
        head.append(f"序号变化 {len(r['idx_changed'])}")
    if r["kw_changed"]:
        head.append(f"关键字变化 {len(r['kw_changed'])}")
    print("变化    " + ("、".join(head) if head else "无") +
          f"（未变 {r['unchanged']} 张，重新编码 {r['regen']} 张）")

    for e in r["added"][:20]:
        print(f"        + {e['dir']}/{e['file']}")
    if len(r["added"]) > 20:
        print(f"        + …还有 {len(r['added']) - 20} 张")
    for e in r["updated"][:10]:
        print(f"        ~ {e['dir']}/{e['file']}")

    def fmt_idx(v):
        return str(v) if v and v > 0 else "-1"

    for e, old in r["idx_changed"][:8]:
        print(f"        序号 {e['dir']}/{e['file']}：{fmt_idx(old)} → {fmt_idx(e['index'])}")
    if len(r["idx_changed"]) > 8:
        print(f"        序号 …还有 {len(r['idx_changed']) - 8} 张")

    for e, old in r["kw_changed"][:8]:
        print(f"        关键字 {e['dir']}/{e['file']}：{'/'.join(old) or '（无）'} → {'/'.join(e['kw']) or '（无）'}")
    if len(r["kw_changed"]) > 8:
        print(f"        关键字 …还有 {len(r['kw_changed']) - 8} 张")

    if r["failed"]:
        print(f"失败    {len(r['failed'])} 张")
        for src, err in r["failed"][:5]:
            print(f"        ! {src}: {err}")

    if r["seeded"]:
        print(f"说明    首次建立同步状态，{len(r['seeded'])} 张按清单体积判定为最新、未重新编码")
        print("        若担心有漏网的改动，可跑一次 --force 全量重建")

    if r["manifest_new"]:
        print("清单    js/sticker-data.js 已生成")
    elif r["manifest_changed"]:
        print("清单    js/sticker-data.js 已更新")
    else:
        print("清单    js/sticker-data.js 无变化（未重写，避免无意义 diff）")

    full_bytes = sum(
        (ASSETS / "full" / f"{e['id']}.webp").stat().st_size
        for e in entries if (ASSETS / "full" / f"{e['id']}.webp").exists())
    thumb_bytes = sum(
        (ASSETS / "thumb" / f"{e['id']}.webp").stat().st_size
        for e in entries if (ASSETS / "thumb" / f"{e['id']}.webp").exists())
    if not args.dry_run:
        print(f"资源    原图 {len(entries)} 个 / {full_bytes / 1048576:.1f} MB"
              f"，缩略图 / {thumb_bytes / 1048576:.1f} MB"
              f"（源文件的 {full_bytes / max(1, total_src) * 100:.0f}%）")

    if no_meta:
        print(f"提醒    {len(no_meta)} 张还没有 .meta（不会有关键字）："
              + "、".join(e["file"] for e in no_meta[:5])
              + ("…" if len(no_meta) > 5 else ""))
        print("        去 _manager 跑 `python sticker.py scan` 再 `index`，然后重新同步")
    if unnumbered:
        print(f"提醒    {len(unnumbered)} 张序号是 -1，会排在列表末尾："
              + "、".join(e["file"] for e in unnumbered[:5]))

    if args.dry_run:
        print("        --dry-run：没有写入任何文件")


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def main(argv=None) -> int:
    # Windows 控制台默认 GBK，中文/符号会炸，这里强制 UTF-8 输出
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    ap = argparse.ArgumentParser(
        description="把本地表情包目录增量同步成工具箱的静态资源 + 清单")
    ap.add_argument("--root", default=DEFAULT_ROOT, help=f"图片根目录（默认 {DEFAULT_ROOT}）")
    ap.add_argument("--full-longest", type=int, default=0,
                    help="原图最长边上限，0 = 不缩放（默认 0）")
    ap.add_argument("--quality", type=int, default=92, help="原图 WebP 质量（默认 92）")
    ap.add_argument("--thumb-longest", type=int, default=480, help="缩略图最长边（默认 480）")
    ap.add_argument("--thumb-quality", type=int, default=80, help="缩略图 WebP 质量（默认 80）")
    ap.add_argument("--force", action="store_true", help="忽略缓存，全部重新生成")
    ap.add_argument("--dry-run", action="store_true", help="只报告，不写文件")
    ap.add_argument("--verbose", action="store_true", help="逐个打印正在处理的图片")
    ap.add_argument("--watch", action="store_true",
                    help="常驻：源目录有变化就自动重新同步（Ctrl+C 退出）")
    ap.add_argument("--interval", type=float, default=3.0,
                    help="watch 模式的轮询间隔秒数（默认 3）")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"根目录不存在：{root}", file=sys.stderr)
        return 1

    t0 = time.time()
    r = sync_once(root, args)
    report(r, root, args)
    print(f"耗时    {time.time() - t0:.1f}s" + ("（dry-run）" if args.dry_run else ""))

    if not args.watch:
        return 0

    # ---- watch：源目录指纹一变就同步 ----
    print(f"\n监听中（每 {args.interval:g}s 检查一次，Ctrl+C 退出）…")
    last = source_fingerprint(r["entries"])
    try:
        while True:
            time.sleep(args.interval)
            entries, _ = scan_source(root)
            fp = source_fingerprint(entries)
            if fp == last:
                continue
            last = fp
            print(f"\n[{time.strftime('%H:%M:%S')}] 检测到源目录变化，重新同步：")
            t0 = time.time()
            r = sync_once(root, args)
            report(r, root, args)
            print(f"耗时    {time.time() - t0:.1f}s")
            print("监听中…")
    except KeyboardInterrupt:
        print("\n已退出监听。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
