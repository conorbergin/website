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


print("<p>Hello, I'm Conor Bergin. I started this website in 2022, just after I finished my engineering degree. I had been reading a lot of blogs on Hacker News and thought I should have one too. It gives me a bit more motivation to finish projects and experiments, and will hopefully be of some use to you, the reader.</p>")

print("<p>Here are my most recent blog posts:</p>")
print(f"<ol reversed start=\"{len(d)}\">")            
for k,v in it.islice(sorted(d,key=lambda x: x[1]["date"], reverse=True),5):
    print(f"<li><a href=\"{k}\">[{v["date"]}] {v["title"]}</a></li>")

print("</ol>")

print("<p>I also have a <a href=\"https://github.com/conorbergin\">Github</a>.</p>")
