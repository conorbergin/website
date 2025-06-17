import json
import os
import itertools as it

d = []

for path, _, files in os.walk("src"):
    for file in files:
        if file == "index.json":
            j = json.load(open(path + "/index.json"))
            if j.get("tags") and "blog" in j["tags"]:
                d.append((path.removeprefix("src") + "/",j))

def p(s):
    print(f"<p>{s}</p>")

p('Hello, welcome to my website. At the moment it contains my blog, and some links to things I recommend.')
p("Here are my most recent blog posts:")
print(f"<ol reversed start=\"{len(d)}\">")            
for k,v in it.islice(sorted(d,key=lambda x: x[1]["date"], reverse=True),5):
    print(f"<li><a href=\"{k}\">[{v["date"]}] {v["title"]}</a></li>")

print("</ol>")

p('I also have a <a href="https://github.com/conorbergin">Github</a>.')
p(" — Conor Bergin.")
