import os

pages_dir = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\pages"
files_to_fix = [
    "ApprovalDiffPage.tsx", "VisualProofPage.tsx", "ProvenancePage.tsx", 
    "TestGuardPage.tsx", "ReportGuardPage.tsx", "ChangeImpactPage.tsx", 
    "RulePackPage.tsx", "TestReadyPage.tsx", "ResultsPage.tsx", 
    "WhyPassPage.tsx", "WhyFailPage.tsx", "SessionSelectorPage.tsx"
]

for filename in files_to_fix:
    path = os.path.join(pages_dir, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="cp1252", errors="ignore") as f:
            content = f.read()
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
