# This takes the regex as a string, as the first arg, and the replacement as the second arg
# Taken from: https://stackoverflow.com/questions/25802204/jekyll-filter-for-regex-substitution-in-content
# Example: {{ page.url | replace_regex: '/$', '' }}:

module Jekyll
  module RegexFilter
    def replace_regex(input, reg_str, repl_str)
      re = Regexp.new reg_str

      # This will be returned
      input.gsub re, repl_str
    end
  end
end

Liquid::Template.register_filter(Jekyll::RegexFilter)
