# Manually bring in Compass Recipes for styling shortcuts
require "compass-recipes"

sass_path = File.dirname(__FILE__)
css_path = File.join(sass_path, "../public/", "css")

output_style = :expanded # nested/expanded/compact/compressed
environment = :development # development/production

# for repeating-linear-gradient
# https://github.com/chriseppstein/compass/issues/401
Compass::BrowserSupport.add_support('repeating-linear-gradient', 'webkit', 'moz', 'o', 'ms')
