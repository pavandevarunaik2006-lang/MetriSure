file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # If the line contains SessionSelectorPage and we already added one in the same import block, skip it.
    if "SessionSelectorPage" in line and i > 40:
        continue
    new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
