import re
import os

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Just literally replace the exact trailing block
bad = """  NotificationsPage,
  SessionSelectorPage



} from '../pages';"""
good = """  NotificationsPage
} from '../pages';"""

content = content.replace(bad, good)

# In case it is slightly different whitespace:
content = re.sub(r"NotificationsPage,\s*SessionSelectorPage\s*\} from '\.\./pages';", "NotificationsPage\n} from '../pages';", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
