import json
import os

d = []

for path, _, files in os.walk("src"):
    for file in files:
        if file == "index.json":
            j = json.load(open(path + "/index.json"))
            if j.get("tags") and "blog" in j["tags"]:
                d.append((path.removeprefix("src") + "/",j))

print("<ol reversed>")
for k,v in sorted(d,key= lambda x: x[1]["date"], reverse=True):
    print(f"<li><a href=\"{k}\">[{v["date"]}] {v["title"]}</a></li>")

print("</ol>")

