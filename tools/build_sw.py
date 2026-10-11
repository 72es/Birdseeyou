"""Regenerate sw.js and version.js after adding files. Run: python3 tools/build_sw.py"""
import os, json, datetime
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
files = ["./", "index.html", "app.css", "app.js", "version.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png",
         "data/birds.json", "data/regions.json"] + sorted("data/regions/" + f for f in os.listdir("data/regions") if f.endswith(".json")) \
        + sorted("img/" + f for f in os.listdir("img"))
ver = datetime.datetime.now().strftime("%Y.%m.%d-%H%M")
open("version.js", "w").write(f'window.BSY_VERSION="{ver}";\n')
sw = open("tools/sw.template.js").read().replace("__VERSION__", ver).replace("__FILES__", json.dumps(files, ensure_ascii=False))
open("sw.js", "w").write(sw)
print("version", ver, "files", len(files))
