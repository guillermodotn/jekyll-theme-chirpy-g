# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-chirpy-g"
  spec.version       = "1.0.4"
  spec.authors       = ["Cotes Chung", "guillermodotn"]
  spec.email         = ["cotes.chung@gmail.com", "guillerm0.n@outlook.es"]

  spec.summary       = "A minimal, responsive, and feature-rich Jekyll theme for technical writing."
  spec.homepage      = "https://github.com/guillermodotn/jekyll-theme-chirpy-g"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f|
    f.match(%r!^((_(includes|layouts|sass|(data\/(locales|origin)))|assets)\/|README|LICENSE)!i)
  } + Dir.glob("assets/js/dist/*") + Dir.glob("_sass/vendors/*")

  spec.metadata = {
    "source_code_uri"   => "https://github.com/guillermodotn/jekyll-theme-chirpy-g",
  }

  spec.required_ruby_version = "~> 3.1"

  spec.add_runtime_dependency "jekyll", "~> 4.3"
  spec.add_runtime_dependency "jekyll-paginate", "~> 1.1"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.8"
  spec.add_runtime_dependency "jekyll-archives", "~> 2.2"
  spec.add_runtime_dependency "jekyll-sitemap", "~> 1.4"
  spec.add_runtime_dependency "jekyll-include-cache", "~> 0.2"

end
