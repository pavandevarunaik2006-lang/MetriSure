import os
import re

routes_file = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"

with open(routes_file, "r") as f:
    content = f.read()

# Add imports
imports_to_add = "SessionSelectorPage, TestReadyPage, ResultsPage, WhyPassPage, WhyFailPage, VisualProofPage, TestGuardPage, ProvenancePage, ReportGuardPage, ApprovalDiffPage, RulePackPage, ChangeImpactPage"

if "SessionSelectorPage" not in content:
    content = content.replace("import {", f"import {{\n  {imports_to_add},")

# Remove all <Navigate to="/test-sessions" replace /> and other redirects that shouldn't be there
content = re.sub(r'<Route path="/(.*?)" element={<Navigate to=".*?" replace />} />', '', content)

# But keep the root redirect
content = content.replace('{/* Redirect root */}\n        ', '{/* Redirect root */}\n        <Route path="/" element={<Navigate to="/dashboard" replace />} />\n        ')

routes = [
    "test-ready",
    "test-execution",
    "results",
    "why-pass",
    "why-fail",
    "visualproof",
    "testguard",
    "provenance",
    "reportguard",
    "approval-diff",
    "change-impact"
]

page_map = {
    "test-ready": "TestReadyPage",
    "test-execution": "TestExecutionPage",
    "results": "ResultsPage",
    "why-pass": "WhyPassPage",
    "why-fail": "WhyFailPage",
    "visualproof": "VisualProofPage",
    "testguard": "TestGuardPage",
    "provenance": "ProvenancePage",
    "reportguard": "ReportGuardPage",
    "approval-diff": "ApprovalDiffPage",
    "change-impact": "ChangeImpactPage"
}

# Find where to insert routes. Just before {/* Reports */}
injection_point = "{/* Reports */}"
new_routes = ""

for path in routes:
    component = page_map[path]
    # Add selector route
    new_routes += f'          <Route path="/{path}" element={{<SessionSelectorPage />}} />\n'
    # Add actual page route
    new_routes += f'          <Route path="/{path}/:id" element={{<{component} />}} />\n'

# We also need RulePacks
new_routes += '          <Route path="/rulepacks" element={<RulePackPage />} />\n'

if "SessionSelectorPage" not in content:
    content = content.replace(injection_point, new_routes + "\n          " + injection_point)

with open(routes_file, "w") as f:
    f.write(content)

print("Patched routes.")
