import re

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will inject the context-dependent routes into the Protected routes section
missing_routes = """
        {/* Context-Dependent Dynamic Routes */}
        <Route path="/test-ready" element={<SessionSelectorPage />} />
        <Route path="/test-ready/:id" element={<TestReadyPage />} />
        
        <Route path="/test-execution" element={<SessionSelectorPage />} />
        <Route path="/test-execution/:id" element={<TestExecutionPage />} />
        
        <Route path="/results" element={<SessionSelectorPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        
        <Route path="/why-pass" element={<SessionSelectorPage />} />
        <Route path="/why-pass/:id" element={<WhyPassPage />} />
        
        <Route path="/why-fail" element={<SessionSelectorPage />} />
        <Route path="/why-fail/:id" element={<WhyFailPage />} />
        
        <Route path="/visualproof" element={<SessionSelectorPage />} />
        <Route path="/visualproof/:id" element={<VisualProofPage />} />
        
        <Route path="/provenance" element={<SessionSelectorPage />} />
        <Route path="/provenance/:id" element={<ProvenancePage />} />
        
        <Route path="/testguard" element={<SessionSelectorPage />} />
        <Route path="/testguard/:id" element={<TestGuardPage />} />
        
        <Route path="/reportguard" element={<SessionSelectorPage />} />
        <Route path="/reportguard/:id" element={<ReportGuardPage />} />
        
        <Route path="/approval-diff" element={<SessionSelectorPage />} />
        <Route path="/approval-diff/:id" element={<ApprovalDiffPage />} />
        
        <Route path="/change-impact" element={<SessionSelectorPage />} />
        <Route path="/change-impact/:id" element={<ChangeImpactPage />} />
        
        <Route path="/rulepacks" element={<RulePacksPage />} />
        <Route path="/rulepacks/:id" element={<RulePackPage />} />
"""

# Avoid double-injecting
if "/test-ready" not in content:
    # Insert right after <Route path="/dashboard" element={<DashboardPage />} />
    content = content.replace(
        '<Route path="/dashboard" element={<DashboardPage />} />',
        '<Route path="/dashboard" element={<DashboardPage />} />\n' + missing_routes
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
