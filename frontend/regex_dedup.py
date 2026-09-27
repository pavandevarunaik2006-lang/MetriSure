import re

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will find all imports between import { and } from '../pages'; and deduplicate them
match = re.search(r"import \{\s*(.*?)\s*\} from '\.\./pages';", content, re.DOTALL)
if match:
    imports_str = match.group(1)
    imports_list = [i.strip() for i in imports_str.split(',') if i.strip()]
    
    unique_imports = list(dict.fromkeys(imports_list))
    new_imports_str = ",\n  ".join(unique_imports)
    
    content = content.replace(imports_str, "\n  " + new_imports_str + "\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
