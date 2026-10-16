#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""在隔离的临时「仓库」里验证同步脚本的增量行为，不碰真实资源与源库。

    python tools/test-sync.py

覆盖：首次同步 / 幂等重跑 / 同名换内容 / 改关键字 / 改序号 / 删图清理 / 缺 meta 提醒。
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

REPO = Path(__file__).resolve().parent.parent
SCRIPT = REPO / "tools" / "build-stickers.py"
LIVE_SRC = Path(r"D:\表情包")

# (源目录, 目标目录, 文件名) —— 用两个目标目录，顺便验证多目录与新目录
PICKS = [
    ("未分类", "甲组", "16BBC7ECBC2752B420731C9A2F4FC584.jpg"),
    ("未分类", "甲组", "B94CD17B4F9F15DE683DD63038A32C6D.jpg"),
    ("未分类", "乙组", "0E8786284174E5FF833DF538BD71396A.png"),
    ("未分类", "乙组", "1C48C2AE0D30201BEE263E7870CD1431.png"),
]

failures: list[str] = []


def check(label: str, cond: bool, detail: str = "") -> None:
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}" + (f"  {detail}" if detail else ""))
    if not cond:
        failures.append(label)


def run(sandbox: Path, srclib: Path) -> str:
    out = subprocess.run(
        [sys.executable, str(sandbox / "repo" / "tools" / "build-stickers.py"),
         "--root", str(srclib)],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if out.returncode != 0:
        failures.append(f"脚本退出码 {out.returncode}")
        print(out.stdout, out.stderr)
    return out.stdout


def line(text: str, prefix: str) -> str:
    for ln in text.splitlines():
        if ln.startswith(prefix):
            return ln.strip()
    return ""


def count_assets(sandbox: Path, sub: str) -> int:
    folder = sandbox / "repo" / "assets" / "stickers" / sub
    return len(list(folder.glob("*.webp"))) if folder.is_dir() else 0


def main() -> int:
    if not (REPO / "tools" / "build-stickers.py").exists():
        print("找不到 tools/build-stickers.py")
        return 1

    sandbox = Path(tempfile.mkdtemp(prefix="sync-proof-"))
    srclib = sandbox / "srclib"
    try:
        (sandbox / "repo" / "tools").mkdir(parents=True)
        (sandbox / "repo" / "js").mkdir(parents=True)
        shutil.copy2(SCRIPT, sandbox / "repo" / "tools" / "build-stickers.py")

        for src_dir, dst_dir, f in PICKS:
            (srclib / dst_dir).mkdir(parents=True, exist_ok=True)
            shutil.copy2(LIVE_SRC / src_dir / f, srclib / dst_dir / f)
            shutil.copy2(LIVE_SRC / src_dir / (f + ".meta"), srclib / dst_dir / (f + ".meta"))

        print("\n① 首次同步")
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("4 张全部新增", "新增 4" in out and "图片更新" not in out)
        check("生成了 4 个原图资源", count_assets(sandbox, "full") == 4)
        check("生成了 4 个缩略图", count_assets(sandbox, "thumb") == 4)
        check("写出清单", (sandbox / "repo" / "js" / "sticker-data.js").exists())
        check("写出状态文件", (sandbox / "repo" / "assets" / "stickers" / ".sync.json").exists())

        print("\n② 幂等重跑")
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("无变化", "变化    无" in out)
        check("未重新编码", "重新编码 0 张" in out)

        print("\n③ 同文件名换内容（旧版本会漏掉）")
        shutil.copy2(LIVE_SRC / "未分类" / "5C40EC83D68AC0E538E5158D646C0817.jpg",
                     srclib / "甲组" / "16BBC7ECBC2752B420731C9A2F4FC584.jpg")
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("识别为图片更新", "图片更新 1" in out)
        check("重新编码 1 张", "重新编码 1 张" in out)

        print("\n④ 改关键字")
        meta = srclib / "乙组" / "0E8786284174E5FF833DF538BD71396A.png.meta"
        meta.write_text(meta.read_text(encoding="utf-8") + "手动补的关键字\n", encoding="utf-8")
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("识别为关键字变化", "关键字变化 1" in out)
        check("没有重新编码图片", "重新编码 0 张" in out)
        manifest = (sandbox / "repo" / "js" / "sticker-data.js").read_text(encoding="utf-8")
        check("清单里出现新关键字", "手动补的关键字" in manifest)

        print("\n⑤ 改序号")
        meta.write_text(
            meta.read_text(encoding="utf-8").replace("# index: 1", "# index: 99"),
            encoding="utf-8")
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("识别为序号变化", "序号变化 1" in out)
        check("没有重新编码图片", "重新编码 0 张" in out)

        print("\n⑥ 删图应清理资源")
        (srclib / "甲组" / "B94CD17B4F9F15DE683DD63038A32C6D.jpg").unlink()
        (srclib / "甲组" / "B94CD17B4F9F15DE683DD63038A32C6D.jpg.meta").unlink()
        out = run(sandbox, srclib)
        print("   " + line(out, "变化"))
        check("识别为移除 1", "移除 1" in out)
        check("原图资源剩 3 个", count_assets(sandbox, "full") == 3)
        check("缩略图剩 3 个", count_assets(sandbox, "thumb") == 3)

        print("\n⑦ 缺 .meta 要提醒")
        shutil.copy2(LIVE_SRC / "黎深牛" / "OK.jpg", srclib / "乙组" / "OK.jpg")
        out = run(sandbox, srclib)
        print("   " + line(out, "提醒"))
        check("提示缺 meta", "还没有 .meta" in out)

        print("\n⑧ 新目录应被收录")
        check("目录行含乙组", "乙组" in line(out, "目录"))

        print("\n⑨ 清单不因时间戳空转")
        stamp_before = re.search(r"生成时间：(\S+ \S+)",
                                 (sandbox / "repo" / "js" / "sticker-data.js").read_text(encoding="utf-8"))
        out = run(sandbox, srclib)
        stamp_after = re.search(r"生成时间：(\S+ \S+)",
                                (sandbox / "repo" / "js" / "sticker-data.js").read_text(encoding="utf-8"))
        check("无变化时不重写清单", "无变化（未重写" in out)
        check("时间戳没被刷新", stamp_before and stamp_after and
              stamp_before.group(1) == stamp_after.group(1))
    finally:
        shutil.rmtree(sandbox, ignore_errors=True)

    print()
    if failures:
        print(f"❌ {len(failures)} 项未通过：" + "、".join(failures))
        return 1
    print("✅ 全部通过")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
