# SentinelAI – AI-Powered Cyber Defense Twin

## 1. Problem Statement
Security teams often receive hundreds of vulnerability alerts from scanners such as Nessus, Qualys, or OpenVAS. While these tools identify vulnerabilities, they do not explain which vulnerabilities create the greatest real-world risk or what will happen if different mitigation strategies are implemented.

In practice, organizations cannot implement every recommendation immediately due to maintenance windows, operational constraints, business dependencies, and limited resources. Security analysts must manually decide which mitigations provide the greatest reduction in cyber risk, making remediation slow and difficult to justify.

SentinelAI solves this problem by allowing analysts to first mathematically evaluate different remediation strategies on a digital twin graph, and then actively test real exploits and patches in a lightweight, ephemeral sandbox before automatically generating the code to apply the selected mitigations to production.

## 2. Target User
**Primary User:**
* Security Analyst

**Secondary Users:**
* Security Engineer
* SOC Analyst
* IT Administrator
* Security Manager

## 3. User Story
As a Security Analyst, I want to upload my organization's infrastructure, review AI-generated mitigation recommendations, select the security controls that are feasible for my organization, verify that the patch blocks active exploits in a sandbox, and finally have the AI generate the code to implement those changes.

## 4. Product Goal
SentinelAI helps organizations move beyond simply identifying vulnerabilities by enabling them to safely evaluate different remediation strategies, prove their efficacy against live simulated attacks in a Micro-Sandbox, prioritize the most effective actions using explainable AI, and seamlessly implement fixes through auto-generated remediation code.

## 5. Core Workflow
```text
Upload Infrastructure
        │
        ▼
Build Digital Twin
        │
        ▼
Create Knowledge Graph
        │
        ▼
Analyze Attack Paths (Neo4j)
        │
        ▼
Generate AI Recommendations
        │
        ▼
User Selects Recommendations
        │
        ▼
Micro-Sandbox Targeted Verification (Active Exploit & Patch Testing)
        │
        ▼
Recalculate Attack Paths
        │
        ▼
Updated Risk Score
        │
        ▼
Explain Why Risk Changed
        │
        ▼
Generate Remediation Code
```

## 6. Implementation

**Step 1 — Upload Infrastructure**
The user uploads a predefined JSON describing: Servers, Applications, Operating Systems, Software Versions, Network Connections.

**Step 2 — Digital Twin Generation**
FastAPI validates the uploaded infrastructure and creates a virtual representation of the organization containing Assets, Software, Connections, and Services.

**Step 3 — Knowledge Graph Construction**
The digital twin is converted into a Neo4j knowledge graph.
* **Nodes:** Asset, Software, CVE, MITRE Technique
* **Relationships:** `Server RUNS Apache`, `Apache HAS_CVE CVE-2024-6387`, `CVE MAPS_TO MITRE T1190`

**Step 4 — Attack Path Analysis**
Neo4j graph algorithms mathematically compute the most critical attack paths (e.g., Internet ↓ Apache ↓ Remote Code Execution ↓ Database). This avoids the heavy resource cost of simulating the entire network.

**Step 5 — AI Recommendation Engine**
The graph context is provided to three AI agents:
*   **Offense Agent:** Explains Entry point, Exploit chain, Assets at risk.
*   **Defense Agent:** Generates recommendations (e.g., Patch Apache, Restrict Database Access) including Reason, Estimated impact, Priority.
*   **Report Agent:** Produces Executive Summary, Risk Score, Business Impact, Prioritized Recommendations.

## 7. Interactive Remediation Planning (Core Feature)
Instead of automatically applying every recommendation, SentinelAI allows the analyst to decide what is practical.
*   **AI recommends:** Patch Apache, Enable MFA, Restrict Database, Upgrade OpenSSL, Network Segmentation, Disable FTP
*   **The organization may only have time for:** ✓ Patch Apache, ✓ Enable MFA, ✓ Restrict Database
*   *The user selects those three.*

## 8. Micro-Sandbox Verification (Active Testing)
Instead of relying purely on graph theory, SentinelAI actively proves the attack and the defense using a "Micro-Sandbox" optimized for low-resource environments (like free-tier hosting or laptops).
*   **Targeted Sandboxing:** The system spins up ephemeral, ultra-lightweight Docker containers (e.g., Alpine Linux) containing mocked versions of *only* the specific vulnerable assets identified in Step 4.
*   **Advanced Red Team Agent Execution:** The Red Team AI actively attacks the sandbox using integrated tools:
    *   **Exploit-DB / Metasploit:** Pulls and fires known payloads for the identified CVEs.
    *   **Burp Suite Model (Headless):** Intercepts and manipulates HTTP/HTTPS requests to test web vulnerabilities (SQLi, XSS).
    *   **Packet Requests:** Uses Scapy to craft and send raw packets to test firewalls and network rules.
    *   **Man-in-the-Middle (MITM):** Deploys a rogue container to simulate ARP/DNS spoofing and verify TLS/certificate enforcement.
*   **Patch Verification:** The Remediation Agent applies the user's selected fixes to the Micro-Sandbox. The Red Team re-executes the attacks. If they fail, the patch is verified. The containers are then immediately destroyed.

## 9. Re-analysis & AI Reassessment
The Neo4j graph is rebuilt using the verified results from the Micro-Sandbox.
*   **Before:** Risk Score = 84
*   **After simulation:** Risk Score = 39
*   **Report:** Implementing the verified mitigations successfully blocked the Metasploit payload and removed the internet-facing attack path to the database. The estimated cyber risk decreases by approximately 54%.

## 10. Explainability
Every recommendation is supported by graph evidence and live sandbox telemetry.
*   **Why did the risk decrease?** Apache ↓ Patched in Sandbox ↓ Metasploit payload failed ↓ No Remote Code Execution ↓ Database unreachable ↓ Risk Score Reduced.

## 11. Auto-Remediation Code Generation
Once the user is satisfied with the verified risk reduction, a **Remediation Agent** generates the actual configuration files, bash scripts, or code snippets required to apply the fixes to the real infrastructure. 
*   **Example:** If the user selected "Enable Firewall Rule" and "Patch Apache," the AI outputs a `ufw` bash script to block the port and an Ansible playbook to upgrade Apache.
*   *The user can copy, download, or review this code before applying it to production.*

## 12. Functional Requirements & Scope (MVP)

**Must Have (In Scope)**
* Upload Infrastructure JSON
* Digital Twin Generation & Neo4j Knowledge Graph
* Attack Path Computation (Graph-based)
* **Targeted Micro-Sandbox (Lightweight Docker)**
* **Advanced Red Team Agent (Metasploit, Scapy, Headless Burp/ZAP, MITM simulation)**
* Defense & Report AI Agents
* AI Recommendations & User Selection
* Live Patch Verification in Sandbox (for the 3 predefined MVP scenarios)
* Risk Score Recalculation & Explainability Panel
* **Remediation Agent (Code/Script Generation & Export)**

**Out of Scope**
* Real exploitation of production infrastructure (attacks run strictly in the ephemeral sandbox)
* Execution of actual ransomware or malware on host systems
* Packet interception on live networks or MitM attacks on real traffic
* Live Burp Suite or manual penetration testing tools outside the headless automated models
* Support for attack scenarios beyond the 3 predefined MVP scenarios

**Nice to Have**
* Interactive graph visualization
* Heatmap of critical assets
* Cloud infrastructure support
* Historical comparison of simulations

## 13. Supported Attack Scenarios (MVP)

The MVP should simulate three predefined attack scenarios:

1. Remote Code Execution (RCE) via an internet-facing Apache Web Server
   - Example vulnerability: CVE-2024-6387
   - MITRE ATT&CK: Initial Access (T1190)
   - Attack Chain: Internet → Apache Server → Remote Code Execution → Application Server → Database
   - AI Recommendations:
     - Patch Apache
     - Enable Web Application Firewall (WAF)
     - Restrict Database Access
     - Network Segmentation

2. ProFTPD FTP Server Compromise
   - Example vulnerability: CVE-2015-3306
   - MITRE ATT&CK: Initial Access (T1190), Execution (T1059)
   - Attack Chain: Internet → ProFTPD Server → Application Server → Database
   - AI Recommendations:
     - Upgrade ProFTPD version
     - Restrict FTP access to known IPs
     - Disable anonymous FTP

3. SQL Injection (SQLi) on Web Application
   - Objective: Extract data or bypass authentication via unsanitized inputs.
   - Attack Chain: Internet → Web Application → SQL Injection → Database
   - Assets Involved: Web Application, Backend Database
   - AI Recommendations:
     - Use Prepared Statements (Parameterized Queries)
     - Implement Input Validation
     - Apply Least Privilege DB Access
   - Outcome: Sandbox verifies that the injection payload is blocked.

## 14. Expected Outputs
* **Risk Score & Explanations:** Real-time feedback on how risk is mitigated.
* **Sandbox Verification:** Logs and status indicators showing successful mitigation in the ephemeral container.
* **Remediation Assets:** Downloadable Bash scripts, Ansible playbooks, and Git diffs representing the verified fixes.

## 15. Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React + Tailwind CSS |
| **Backend** | FastAPI |
| **Knowledge Graph** | Neo4j, Cypher, NetworkX |
| **AI Agents** | LangGraph, GPT-5.5 / Gemini 2.5 Pro |
| **Sandbox Environment** | Lightweight Docker / Alpine Linux |
| **Red Team Tools** | Metasploit, Exploit-DB, Scapy, OWASP ZAP (Headless) |
| **Threat Intelligence** | Curated CVE + MITRE JSON |

---

# Complete Q&A Structure (SentinelAI Blueprint)

# Q1. What is the complete user workflow?
### Answer
```
Landing Page
      │
      ▼
Login / Signup (Firebase Authentication)
      │
      ▼
Dashboard
      │
      ▼
Create New Security Assessment
      │
      ▼
Choose Input Method
      ├── Connect GitHub Repository (Primary)
      └── Upload ZIP File (Fallback)
      │
      ▼
Repository Cloned into Secure Temporary Workspace
      │
      ▼
Digital Twin Generation
      │
      ▼
Knowledge Graph Creation (Neo4j)
      │
      ▼
Static Code Analysis + Dependency Analysis
      │
      ▼
Threat Intelligence Mapping (CVE + MITRE ATT&CK)
      │
      ▼
Attack Path Analysis
      │
      ▼
Red Team Validation
      │
      ▼
Blue Team Recommendations
      │
      ▼
Security Report Generated
      │
      ▼
User Selects Vulnerabilities to Fix
      │
      ▼
AI Generates Secure Patch
      │
      ▼
Patch Applied in Sandbox
      │
      ▼
Red Team Re-tests
      │
      ▼
Risk Score Recalculated
      │
      ▼
Updated Report
      │
      ▼
Download Code / Git Diff / Scripts
      │
      ▼
Manual Production Deployment
```

---

# Q2. What should the user upload?
### Answer
**Primary Option:** Connect GitHub Repository (OAuth) for read-only access.
**Fallback Option:** Upload ZIP file.
**Recommendation:** Keep GitHub as the primary option because it provides a much smoother experience.

---

# Q3. Why use GitHub instead of only ZIP?
### Answer
GitHub allows SentinelAI to clone the latest code automatically, analyze the entire project structure, detect dependencies, generate Git diffs, create Pull Request–ready patches, and avoid repeated ZIP uploads. ZIP upload should be available as a fallback for users without GitHub access.

---

# Q4. What happens after the repository is uploaded?
### Answer
```
Clone Repository
        │
        ▼
Create Temporary Workspace
        │
        ▼
Build Digital Twin
        │
        ▼
Create Knowledge Graph
        │
        ▼
Dependency Analysis
        │
        ▼
Threat Intelligence Mapping
        │
        ▼
Ready for Security Testing
```

---

# Q5. How will the Red Team decide which attacks to perform?
### Answer
The Red Team does not run random attacks. It performs **targeted attacks** based on findings from the programming language, framework, dependencies, CVEs, open ports, application type, and attack paths identified in the graph.
**Example:** If the project uses Apache ➔ Check Apache CVEs ➔ Known Exploits ➔ Metasploit ➔ Execute Relevant Payload.

---

# Q6. Which tools will the Red Team use?
### Answer
Depending on the detected vulnerabilities: Metasploit, Exploit-DB, Scapy, OWASP ZAP (Headless), Nmap, and Custom Python security scripts. Each tool is used only when relevant to the identified attack surface.

---

# Q7. What happens after the Red Team finishes?
### Answer
The Blue Team starts. It reviews attack results, finds successful exploits, maps vulnerabilities to CVEs, calculates risk, generates remediation recommendations, estimates risk reduction, and explains why each recommendation matters.

---

# Q8. What does the user do after receiving the report?
### Answer
The user reviews all recommendations and chooses only the fixes they want (e.g., ticking boxes for "SQL Injection" and "Apache Patch"). This keeps the user in control of remediation.

---

# Q9. What happens after the user selects vulnerabilities?
### Answer
The AI Remediation Agent reviews the selected code, generates secure patches, produces updated code, creates Git diffs, and generates deployment scripts if needed. The AI only modifies the vulnerabilities selected by the user.

---

# Q10. Will the AI modify production code directly?
### Answer
No. The AI modifies only the sandbox copy of the repository. Production code is never changed automatically. The user reviews and approves the generated changes before deployment.

---

# Q11. How is the generated patch verified?
### Answer
```
Apply Patch
      │
      ▼
Restart Sandbox
      │
      ▼
Run Red Team Again
      │
      ▼
Exploit Successful?
      │
      ├── Yes -> Patch Failed
      │
      └── No -> Patch Verified
```
Only verified patches are recommended for production.

---

# Q12. How is the risk score updated?
### Answer
The system compares the "Before Fix" state (Successful Attack = High Risk) with the "After Fix" state (Attack Failed = Reduced Risk). 
Example: Before Risk Score = 87 ➔ After Risk Score = 41 ➔ Risk Reduction = 53%.

---

# Q13. What does the final report contain?
### Answer
Executive Summary, Vulnerability List, Attack Paths, Successful Exploits, Risk Score, Recommended Fixes, Selected Fixes, Patch Verification Results, Updated Risk Score, Explainability, Generated Code, Git Diff, and Deployment Scripts.

---

# Q14. How should the backend be deployed?
### Answer
Deploy the backend as a Docker container (e.g., Frontend on Vercel ➔ FastAPI Backend on Docker ➔ Neo4j ➔ PostgreSQL ➔ Sandbox Manager on Docker Host). This keeps deployment simple and portable.

---

# Q15. Can the frontend call the backend APIs?
### Answer
Yes. React (Vercel) ➔ HTTPS API ➔ FastAPI Backend ➔ Neo4j / Sandbox Service. Enable CORS in FastAPI and configure the backend URL using environment variables.

---

# Q16. Should the backend itself create sandbox containers?
### Answer
For the MVP, yes. The backend can directly communicate with the Docker Engine to create and destroy temporary sandbox containers. For production, it's better to use a separate Sandbox Manager service.

---

# Q17. What is the recommended deployment architecture?
### Answer
```
                User
                  │
                  ▼
        React Frontend (Vercel)
                  │
            HTTPS API
                  │
                  ▼
       FastAPI Backend (Docker)
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
   Neo4j      PostgreSQL   LangGraph
                  │
                  ▼
   Sandbox Manager (Docker Engine)
                  │
                  ▼
           Temporary Sandbox
```

---

# Q18. What is the final recommended architecture for SentinelAI?
### Answer
*   **Frontend:** React + Tailwind CSS (Vercel)
*   **Authentication:** Firebase Authentication
*   **Backend:** FastAPI (Docker)
*   **Knowledge Graph:** Neo4j
*   **Database:** PostgreSQL
*   **AI Agents:** LangGraph + GPT-5.5/Gemini
*   **Threat Intelligence:** CVE + MITRE ATT&CK
*   **Sandbox:** Ephemeral Docker Containers
*   **Red Team:** Metasploit, OWASP ZAP (Headless), Scapy, Exploit-DB
*   **Blue Team:** AI-powered remediation and risk analysis
*   **Output:** Verified patches, Git diffs, Bash scripts, Ansible playbooks, and downloadable reports.
