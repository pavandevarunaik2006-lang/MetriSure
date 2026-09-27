import re
import os

files = [
    "frontend/src/pages/TestSessionsPage.tsx",
    "frontend/src/pages/ReviewWorkspacePage.tsx",
    "frontend/src/pages/ReportRepositoryPage.tsx"
]

for file in files:
    path = os.path.join(r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure", file)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Clean up the mess
    content = re.sub(r"import \{ useNavigate \}\nimport \{ apiClient \} from '../api/client';", "import { apiClient } from '../api/client';", content)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {file}")
