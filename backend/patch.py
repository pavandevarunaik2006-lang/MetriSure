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

    # Generic patch to remove mock import and add apiClient and useEffect
    content = content.replace("import { mockTestSessions", "// import { mockTestSessions")
    content = content.replace("import { mockInstruments", "// import { mockInstruments")
    if "apiClient" not in content:
        content = content.replace("import { useState }", "import { useState, useEffect }")
        content = content.replace("import { useNavigate }", "import { useNavigate }\nimport { apiClient } from '../api/client';")

    if "TestSessionsPage.tsx" in file:
        content = re.sub(r'const filteredSessions = mockTestSessions\.filter\(.*?\);', '', content, flags=re.DOTALL)
        content = content.replace("export function TestSessionsPage() {", """export function TestSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => { apiClient.get('/test-sessions').then(res => setSessions(res.data)); }, []);
  const filteredSessions = sessions;
""")
        # fix the table fields
        content = content.replace("session.session_number", "session.id")
        content = content.replace("session.instrument_name", "session.instrument?.model?.model_name")
        content = content.replace("session.serial_number", "session.instrument?.serial_number")
        
    elif "ReviewWorkspacePage.tsx" in file:
        content = re.sub(r'const reviewSessions = mockTestSessions\.filter\(.*?\);', '', content, flags=re.DOTALL)
        content = content.replace("export function ReviewWorkspacePage() {", """export function ReviewWorkspacePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => { apiClient.get('/test-sessions').then(res => setSessions(res.data.filter((s: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(s.status)))); }, []);
  const reviewSessions = sessions;
""")
        content = content.replace("session.session_number", "session.id")
        content = content.replace("session.instrument_name", "session.instrument?.model?.model_name")
        content = content.replace("session.serial_number", "session.instrument?.serial_number")

    elif "ReportRepositoryPage.tsx" in file:
        content = re.sub(r'const filteredReports = mockTestSessions\.filter\(.*?\);', '', content, flags=re.DOTALL)
        content = content.replace("export function ReportRepositoryPage() {", """export function ReportRepositoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => { apiClient.get('/reports').then(res => setReports(res.data)); }, []);
  const filteredReports = reports;
""")
        content = content.replace("report.session_number", "report.report_number")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {file}")
