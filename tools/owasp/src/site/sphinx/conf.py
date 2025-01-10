# -*- coding: utf-8 -*-
import sys, os

project = u'gestione vulnerabilita OWASP'
copyright = u'Copyright (c) 2021-2025 Link.it srl (https://link.it).'
version = '2.0'
release = '2.0.0'

# General options
needs_sphinx = '1.0'
master_doc = 'index'
pygments_style = 'tango'
add_function_parentheses = True

extensions = ['recommonmark', 'sphinx.ext.autodoc', 'sphinxcontrib.plantuml']

templates_path = ['_templates']
exclude_trees = ['.build']
source_encoding = 'utf-8-sig'

# HTML options
html_theme = 'sphinx_rtd_theme'
html_short_title = "govcat-owasp"
htmlhelp_basename = 'govcat-owasp-doc'
html_use_index = True
html_show_sourcelink = False
html_static_path = ['_static']

# PlantUML options
plantuml = os.getenv('plantuml')
