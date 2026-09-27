import re

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the specific duplicate at the end of the import block
content = content.replace("    NotificationsPage,\n    SessionSelectorPage\n  \n  \n} from '../pages';", "    NotificationsPage\n} from '../pages';")

with open(file_path, "w") as f:
    f.write(content)
