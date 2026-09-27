import re

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I will replace all the bad imports
bad_string = "SessionSelectorPage, TestReadyPage, ResultsPage, WhyPassPage, WhyFailPage, VisualProofPage, TestGuardPage, ProvenancePage, ReportGuardPage, ApprovalDiffPage, RulePackPage, ChangeImpactPage,"

content = content.replace(bad_string, "")

with open(file_path, "w") as f:
    f.write(content)
