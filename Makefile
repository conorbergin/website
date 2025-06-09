PORT := 8080
INPUT_DIR := src
OUTPUT_DIR := .output
CACHE_DIR := .cache
PANDOC := pandoc

BLOG_HTML := $(OUTPUT_DIR)/blog/index.html
INDEX_HTML := $(OUTPUT_DIR)/index.html
#BOOKMARKS_HTML := $(OUTPUT_DIR)/bookmarks/index.html

PARTIAL_DIR := $(CACHE_DIR)/partials

# Find all source files (both .md and .dj)
CONTENT_FILES := $(shell find $(INPUT_DIR) -type f \( -name '*.dj' \))
JSON_FILES := $(shell find $(INPUT_DIR) -type f \( -name '*.json' \))

OTHER_FILES := $(shell find $(INPUT_DIR) -type f ! \( -name '*.md' -o -name '*.dj' -o -name '*.yaml' -o -name '*.zon' -o -name '*.toml' -o -name '*.json' -o -name '*.md' \))
#OTHER_FILES := $(shell find $(INPUT_DIR) -type f \( -name '*.css' -o -name '*.js' \))
# Convert .md and .dj files to .html
PARTIAL_FILES := $(patsubst $(INPUT_DIR)/%, $(PARTIAL_DIR)/%, $(CONTENT_FILES:.dj=.html))


HTML_FILES := $(patsubst $(PARTIAL_DIR)/%, $(OUTPUT_DIR)/%, $(PARTIAL_FILES))
COPIED_FILES := $(patsubst $(INPUT_DIR)/%, $(OUTPUT_DIR)/%, $(OTHER_FILES))

# Final target
all: $(PARTIAL_FILES) $(HTML_FILES)  $(INDEX_HTML) $(COPIED_FILES) $(BLOG_HTML)

# Rule for converting .dj to .html
$(PARTIAL_DIR)/%.html: $(INPUT_DIR)/%.dj
	@mkdir -p $(dir $@)
	$(PANDOC) $< -o $@ --mathml

# Rule for templating HTML (prepend title from front matter)
$(OUTPUT_DIR)/%.html: $(PARTIAL_DIR)/%.html $(INPUT_DIR)/%.json template.py main.jinja2
	@mkdir -p $(dir $@)
	@echo "templating $@"
	@python template.py $(word 2, $^) $< > $@

# Rule for copying other files
$(OUTPUT_DIR)/%: $(INPUT_DIR)/%
	@mkdir -p $(dir $@)
	cp $< $@

# /index.html depends on all frontmatter files
$(INDEX_HTML): $(JSON_FILES) index.py template.py main.jinja2
	@mkdir -p $(dir $@)
	@python index.py | python template.py  src/index.json /dev/stdin > $@


# /index.html depends on all frontmatter files
$(BLOG_HTML): $(JSON_FILES) blog.py template.py main.jinja2
	@mkdir -p $(dir $@)
	@python blog.py | python template.py  src/index.json /dev/stdin > $@
# Clean output directory
clean:
	rm -rf $(OUTPUT_DIR)/* $(CACHE_DIR)/*

serve:
	@mkdir -p $(OUTPUT_DIR)/
	python -m http.server $(PORT) --directory $(OUTPUT_DIR)

.PHONY: all clean serve debug

debug:
	@echo CONTENT_FILES = $(CONTENT_FILES)
	@echo PARTIAL_FILES = $(PARTIAL_FILES)
	@echo HTML_FILES = $(HTML_FILES)
