import jinja2

import sys
import os
import json


if len(sys.argv) !=  3:
    print("script <data.json> <content.html>")

context = json.load(open(sys.argv[1]))
content = open(sys.argv[2]).read()

env = jinja2.Environment(loader=jinja2.FileSystemLoader('.'))

main_template = env.get_template("main.jinja2")

context["content"] = f"<h1>{context["title"]}</h1>\n<code>{context["date"]}</code>\n" + content if context.get("tags") and "blog" in context.get("tags") else content
print(main_template.render(context))
