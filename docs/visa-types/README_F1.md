# F-1 Student Visa Interview Context - Quick Start

## 🎯 What's New

Your Vysa app now has **authentic F-1 visa interview capabilities** based on real U.S. consular practice, INA §214(b), and Foreign Affairs Manual (FAM) guidance.

---

## 📚 Key Resources

| Document | Purpose |
|----------|---------|
| **`F1_INTEGRATION_SUMMARY.md`** | Complete implementation details, testing scenarios, agent behavior examples |
| **`F1_INTERVIEW_GUIDE.md`** | Comprehensive reference: legal framework, 180 questions, consulate playbooks, denial prevention |
| **`AGENT_CONTEXT_SETUP.md`** | Overall system documentation with F-1 integration section |

---

## ⚡ Quick Test

### 1. Deploy Agent (if not already done)

```bash
cd /Users/justinkroeger/agent-starter-python
lk agent deploy
```

### 2. Start Frontend

```bash
cd /Users/justinkroeger/interview-app
npm run dev
```

### 3. Run F-1 Interview

1. Go to `http://localhost:3000`
2. Sign in
3. Select **"Student Visa (F-1)"**
4. Configure settings (20 min, focus areas: "Financial Background", "Ties to Home Country")
5. Upload fake documents (bank statement, I-20 form, employment letter)
6. Start interview

### 4. Monitor Agent

```bash
lk agent logs
```

---

## 🔍 What to Look For

### Agent Behavior
- ✅ Firm, professional, skeptical tone (like real consular officer)
- ✅ Questions about nonimmigrant intent: "Why will you return home?"
- ✅ Financial probing: "What is your sponsor's income?" "Can I see your bank statements?"
- ✅ Academic depth: "Why this university?" "How does this relate to your career?"
- ✅ Red flag detection: Challenges vague answers, OPT emphasis, weak ties
- ✅ Document verification: Asks to see I-20, SEVIS receipt, uses RAG to check uploaded docs

### Agent Logs Should Show
```
✅ Loaded agent config: visaType=student, duration=20...
✅ System prompt includes: "INA §214(b) which PRESUMES immigrant intent"
✅ Question bank: 180 questions loaded
✅ Ragie partitions: ['visa-student', 'visa-student-user-user_abc123']
✅ Time update: 20s elapsed (0:20 / 20:00)
✅ Calling tool: lookup_user_documents
✅ Calling tool: lookup_reference_documents
```

---

## 🎓 Key Features

### 180+ Authentic Questions
Organized into 11 categories matching real F-1 interviews:
- Academic Purpose & Program Fit
- Financial Ability
- Ties to Home Country (critical for §214(b))
- Immigration History & Intent
- English Proficiency
- Documentation & DS-160 Consistency
- Field Change & Academic Integrity
- Practical Training & Work Intentions (OPT/CPT)
- Security & Inadmissibility
- Family & Travel History
- Edge Cases & Situational

### INA §214(b) Framework
Agent understands and applies:
- **Presumption of immigrant intent** (burden of proof on applicant)
- **Nonimmigrant intent assessment** (ties to home country)
- **Financial scrutiny** (verifiable, sufficient funds)
- **Academic purpose verification** (clear goals, logical fit)
- **Red flag detection** (vague answers, coaching, fraud indicators)

### RAG Document Verification
Agent can query two partitions:
- **User documents**: `lookup_user_documents` → Bank statements, I-20, transcripts, sponsor letters
- **Global documents**: `lookup_reference_documents` → F-1 regulations, SEVP guidelines, FAM excerpts

### Consulate-Specific Knowledge
Agent has awareness of regional patterns from:
- India (Mumbai, Delhi, Chennai, Hyderabad, Kolkata)
- China (Beijing, Shanghai, Guangzhou)
- Vietnam, Nepal, Nigeria, Pakistan, Bangladesh, Brazil, South Korea

---

## 🧪 Test Scenarios

### Scenario 1: Strong Candidate (Should Approve)
```
User Profile:
- Studying CS at University of Illinois
- Clear reason for university choice (AI research program)
- Strong ties: Family business, property ownership, job contacts in home country
- Adequate funding: Parent sponsor with $60k income, verified bank statements
- Prepared: Has I-20, SEVIS receipt, knows program details

Expected Agent Behavior:
- Asks thorough questions but satisfied with answers
- Verifies documents via RAG
- Approves: "Your ties seem strong, academic purpose is clear, finances are adequate. Approved."
```

### Scenario 2: Weak Candidate (Should Deny)
```
User Profile:
- Vague about university choice ("It was recommended by my agent")
- No clear post-graduation plans
- Emphasis on OPT and working in U.S.
- Insufficient funding or suspicious large deposits
- Missing I-20 or SEVIS receipt

Expected Agent Behavior:
- Probes weak areas intensely
- Challenges vague answers: "Can you be more specific?"
- Questions immigrant intent: "You mentioned working in the U.S. for several years..."
- Denies under §214(b): "I'm not convinced you've demonstrated nonimmigrant intent. Refused."
```

### Scenario 3: Red Flags (Should Probe Heavily)
```
User Profile:
- Rehearsed, robotic answers
- Relatives in U.S. (especially undocumented or overstayed)
- Low-ranked or high-dropout school
- Field mismatch (studied law, now applying for engineering)
- Recent large financial deposit without explanation

Expected Agent Behavior:
- Intense questioning: "That sounds memorized. In your own words..."
- Probes inconsistencies: "Why the field change?"
- Asks about relatives: "What is their status?"
- Questions funding: "Where did this deposit come from?"
- Likely denial or very skeptical approval
```

---

## 📖 Documentation Hierarchy

```
F1_INTEGRATION_SUMMARY.md
├── Implementation details
├── Agent behavior examples
├── Testing instructions
└── Next steps

F1_INTERVIEW_GUIDE.md
├── Legal framework (INA §214(b), FAM)
├── 180 questions with categories
├── Common wrong answers
├── Consulate-specific playbooks
├── Denial prevention checklist
└── Mock interview script

AGENT_CONTEXT_SETUP.md
├── Overall system architecture
├── F-1 integration section
├── Testing checklist
└── Troubleshooting

README_F1.md (this file)
└── Quick start guide
```

---

## 🚀 Ready to Use

The system is **fully integrated and ready for testing**. The agent will automatically use the F-1 context when a user selects "Student Visa (F-1)" in the interview flow.

### Next Steps:
1. **Test immediately** using scenarios above
2. **Review agent logs** to see F-1 context in action
3. **Upload global reference documents** (optional): F-1 regulations, SEVP guidelines
4. **Enhance other visa types** using F-1 as template

---

## 💡 Tips

- **Agent tone**: Expect firm, professional, slightly skeptical (this is authentic)
- **Question pacing**: Agent adapts to selected duration (10/20/30 min)
- **Document lookups**: Agent will ask "Can I see your [document]?" and use RAG
- **Time awareness**: Agent receives updates every 20s and wraps up at ~80% mark
- **Red flags**: Agent probes vague, rehearsed, or inconsistent answers

---

## 🎉 Success Metrics

Your F-1 implementation is working if:

✅ Agent asks questions from all major categories (academic, financial, ties, immigration)  
✅ Agent exhibits skeptical, firm demeanor (not overly friendly)  
✅ Agent probes weak answers and inconsistencies  
✅ Agent uses RAG tools to verify document claims  
✅ Agent can approve strong candidates and deny weak ones  
✅ Interview paces appropriately for selected duration  
✅ Agent gracefully concludes when time is up  

---

**Questions?** See `F1_INTEGRATION_SUMMARY.md` for detailed troubleshooting and support.

🚀 **Happy testing!**


