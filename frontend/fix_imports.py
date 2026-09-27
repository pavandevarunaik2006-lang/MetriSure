import re

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Remove the broken imports
bad_string = "  SessionSelectorPage, TestReadyPage, ResultsPage, WhyPassPage, WhyFailPage, VisualProofPage, TestGuardPage, ProvenancePage, ReportGuardPage, ApprovalDiffPage, RulePackPage, ChangeImpactPage, "
content = content.replace(bad_string, "  ")

# Import them properly from '../pages'
if "SessionSelectorPage" not in content:
    content = content.replace("import {", "import {\n  SessionSelectorPage, TestReadyPage, ResultsPage, WhyPassPage, WhyFailPage, VisualProofPage, TestGuardPage, ProvenancePage, ReportGuardPage, ApprovalDiffPage, RulePackPage, ChangeImpactPage,\n", 1)

with open(file_path, "w") as f:
    f.write(content)
