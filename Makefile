
PORT := 8080
INPUT_DIR := src
OUTPUT_DIR := .output
PANDOC := pandoc

CACHE_DIR := .cache

PARTIAL_DIR := $(CACHE_DIR)/partials

# Find all source files
CONTENT_FILES := $(shell find $(INPUT_DIR) -type f -name '*.md')
OTHER_FILES := $(shell find $(INPUT_DIR) -type f ! -name '*.md')

# Convert .md files to .html
PARTIAL_FILES := $(patsubst $(INPUT_DIR)/%.md, $(PARTIAL_DIR)/%.html, $(CONTENT_FILES))
HTML_FILES := $(patsubst $(INPUT_DIR)/%.md, $(OUTPUT_DIR)/%.html, $(CONTENT_FILES))
COPIED_FILES := $(patsubst $(INPUT_DIR)/%, $(OUTPUT_DIR)/%, $(OTHER_FILES))

# Ensure partial files are not deleted
# .SECONDARY: $(PARTIAL_FILES)


# Final target
all: $(PARTIAL_FILES) $(HTML_FILES) $(COPIED_FILES) 
# Ensure partial files are not deleted

# Rule for converting .md to .html
$(PARTIAL_DIR)/%.html: $(INPUT_DIR)/%.md
	@mkdir -p $(dir $@)
	$(PANDOC) $< -o $@

# templating html
$(OUTPUT_DIR)/%.html: $(PARTIAL_DIR)/%.html header.html
	@mkdir -p $(dir $@)
	cat header.html $< > $@	

# Rule for copying other files
$(OUTPUT_DIR)/%: $(INPUT_DIR)/%
	@mkdir -p $(dir $@)
	cp $< $@

# Clean output directory
clean:
	rm -rf $(OUTPUT_DIR)/*

serve:
	@mkdir -p $(OUTPUT_DIR)/
	python -m http.server $(PORT) --directory $(OUTPUT_DIR)
	

.PHONY: all clean
