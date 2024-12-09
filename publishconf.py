# This file is only used if you use `make publish` or
# explicitly specify it as your config file.

import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *  # noqa: F403

# SITEURL = "https://natelandau.com"
SITEURL = "https://natelandau-com.pages.dev"
RELATIVE_URLS = False
GISCUS_DATA_CATEGORY_ID = "DIC_kwDOIM6z9s4CSACn"
GISCUS_DATA_CATEGORY = "Comments"


DELETE_OUTPUT_DIRECTORY = True
