# 📚 Interview App Documentation

Welcome to the complete documentation for the Interview App. This guide will help you navigate through all available documentation organized by topic.

---

## 📖 Table of Contents

- [Quick Start](#-quick-start)
- [Setup & Deployment](#-setup--deployment)
- [Agent Configuration](#-agent-configuration)
- [Architecture & Design](#-architecture--design)
- [Payment & Billing](#-payment--billing)
- [Real-Time Communication](#-real-time-communication)
- [Document Management](#-document-management)
- [Infrastructure](#-infrastructure)
- [Visa Types](#-visa-types)
- [Implementation Notes](#-implementation-notes)
- [Security](#-security)
- [Testing](#-testing)

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[Setup Guide](setup/SETUP_GUIDE.md)** - Initial setup and configuration
2. **[Domain Update Guide](setup/DOMAIN_UPDATE_GUIDE.md)** - Configure for production deployment
3. **[Pre-Deployment Checklist](setup/PRE_DEPLOYMENT_CHECKLIST.md)** - Final checks before going live

---

## 🛠️ Setup & Deployment

**Location:** `docs/setup/`

| Document                                                             | Description                                         |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| [**SETUP_GUIDE.md**](setup/SETUP_GUIDE.md)                           | Complete initial setup instructions for development |
| [**PRE_DEPLOYMENT_CHECKLIST.md**](setup/PRE_DEPLOYMENT_CHECKLIST.md) | Production deployment checklist and configuration   |
| [**DOMAIN_UPDATE_GUIDE.md**](setup/DOMAIN_UPDATE_GUIDE.md)           | Master guide for updating all domain references     |

**When to Use:**

- Setting up local development environment
- Preparing for production deployment
- Migrating to a new domain

---

## 🤖 Agent Configuration

**Location:** `docs/agent/`

| Document                                                         | Description                                   |
| ---------------------------------------------------------------- | --------------------------------------------- |
| [**AGENT_UPDATE_GUIDE.md**](agent/AGENT_UPDATE_GUIDE.md)         | How to update and configure the LiveKit agent |
| [**AGENT_CONTEXT_SETUP.md**](agent/AGENT_CONTEXT_SETUP.md)       | Setting up agent context and instructions     |
| [**AGENT_CHANGES_COMPLETE.md**](agent/AGENT_CHANGES_COMPLETE.md) | Summary of agent modifications                |
| [**GRACEFUL_DISCONNECT.md**](agent/GRACEFUL_DISCONNECT.md)       | Implementing graceful agent disconnection     |

**When to Use:**

- Setting up the Python agent
- Modifying agent behavior or prompts
- Troubleshooting agent issues
- Understanding disconnect handling

---

## 🏗️ Architecture & Design

**Location:** `docs/architecture/`

| Document                                                        | Description                                |
| --------------------------------------------------------------- | ------------------------------------------ |
| [**PROJECT_SUMMARY.md**](architecture/PROJECT_SUMMARY.md)       | High-level project overview and goals      |
| [**FINAL_ARCHITECTURE.md**](architecture/FINAL_ARCHITECTURE.md) | Complete system architecture documentation |
| [**FEATURES.md**](architecture/FEATURES.md)                     | Feature list and capabilities              |
| [**INTERVIEW_FLOW.md**](architecture/INTERVIEW_FLOW.md)         | User journey and interview flow            |
| [**REFACTOR_SUMMARY.md**](architecture/REFACTOR_SUMMARY.md)     | History of major refactoring changes       |

**When to Use:**

- Understanding the overall system
- Planning new features
- Onboarding new developers
- Making architectural decisions

---

## 💳 Payment & Billing

**Location:** `docs/stripe/`

| Document                                                          | Description                              |
| ----------------------------------------------------------------- | ---------------------------------------- |
| [**STRIPE_QUICKSTART.md**](stripe/STRIPE_QUICKSTART.md)           | Get Stripe working in 5 minutes          |
| [**STRIPE_SETUP_GUIDE.md**](stripe/STRIPE_SETUP_GUIDE.md)         | Comprehensive Stripe integration guide   |
| [**STRIPE_ARCHITECTURE.md**](stripe/STRIPE_ARCHITECTURE.md)       | How Stripe integration works             |
| [**STRIPE_TESTING_GUIDE.md**](stripe/STRIPE_TESTING_GUIDE.md)     | Testing credit purchases and webhooks    |
| [**POST_INTERVIEW_CREDITS.md**](stripe/POST_INTERVIEW_CREDITS.md) | Credit deduction system (post-interview) |

**When to Use:**

- Setting up payment processing
- Implementing credit system
- Testing purchases
- Understanding credit deduction logic
- Troubleshooting payment issues

---

## 🎙️ Real-Time Communication

**Location:** `docs/livekit/`

| Document                                                                     | Description                             |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| [**LIVEKIT_SETUP.md**](livekit/LIVEKIT_SETUP.md)                             | LiveKit initial setup and configuration |
| [**LIVEKIT_INTEGRATION_SUMMARY.md**](livekit/LIVEKIT_INTEGRATION_SUMMARY.md) | How LiveKit is integrated               |
| [**LIVEKIT_RECORDING_SETUP.md**](livekit/LIVEKIT_RECORDING_SETUP.md)         | Setting up interview recording to S3    |
| [**TRANSCRIPT_CAPTURE.md**](livekit/TRANSCRIPT_CAPTURE.md)                   | How interview transcripts are captured  |

**When to Use:**

- Setting up real-time voice/video
- Configuring interview recording
- Understanding transcript generation
- Troubleshooting connection issues

---

## 📄 Document Management

**Location:** `docs/ragie/`

| Document                                                             | Description                     |
| -------------------------------------------------------------------- | ------------------------------- |
| [**RAGIE_PARTITIONS.md**](ragie/RAGIE_PARTITIONS.md)                 | RAG document partition strategy |
| [**PARTITION_SIMPLIFICATION.md**](ragie/PARTITION_SIMPLIFICATION.md) | Simplified partition approach   |

**When to Use:**

- Setting up document RAG system
- Uploading visa documentation
- Understanding document retrieval
- Managing document partitions

---

## 🏗️ Infrastructure

**Location:** `docs/infrastructure/`

| Document                                                                  | Description                                 |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| [**AWS_S3_LIFECYCLE_SETUP.md**](infrastructure/AWS_S3_LIFECYCLE_SETUP.md) | S3 bucket lifecycle rules for auto-deletion |
| [**EMAIL_NOTIFICATIONS.md**](infrastructure/EMAIL_NOTIFICATIONS.md)       | Email notification system (Resend)          |

**When to Use:**

- Setting up AWS S3 for recordings
- Configuring automatic file deletion
- Implementing email notifications
- Troubleshooting email delivery

---

## 🛂 Visa Types

**Location:** `docs/visa-types/`

| Document                                                              | Description                      |
| --------------------------------------------------------------------- | -------------------------------- |
| [**F1_INTERVIEW_GUIDE.md**](visa-types/F1_INTERVIEW_GUIDE.md)         | F-1 Student Visa interview guide |
| [**F1_INTEGRATION_SUMMARY.md**](visa-types/F1_INTEGRATION_SUMMARY.md) | How F-1 visa type is integrated  |
| [**README_F1.md**](visa-types/README_F1.md)                           | F-1 specific documentation       |

**When to Use:**

- Understanding visa-specific configurations
- Adding new visa types
- Customizing interview questions
- Reviewing visa requirements

---

## 💻 Implementation Notes

**Location:** `docs/implementation/`

| Document                                                                  | Description                                                |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [**IMPLEMENTATION_SUMMARY.md**](implementation/IMPLEMENTATION_SUMMARY.md) | Summary of all implementations and changes                 |
| [**AGENT_STATE_INDICATOR.md**](implementation/AGENT_STATE_INDICATOR.md)   | Visual agent state indicator (listening/thinking/speaking) |
| [**DEBUG_LOGS.md**](implementation/DEBUG_LOGS.md)                         | Debugging notes and common issues                          |

**When to Use:**

- Understanding what was built and why
- Debugging issues
- Reviewing implementation decisions
- Finding solutions to common problems

---

## 🔒 Security

**Location:** `docs/security/`

| Document                                                                      | Description                        |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| [**SECURITY_FIX_CVE-2025-55182.md**](security/SECURITY_FIX_CVE-2025-55182.md) | Next.js security vulnerability fix |

**When to Use:**

- Understanding security patches
- Reviewing security considerations
- Auditing dependencies

---

## 🧪 Testing

**Location:** `docs/testing/`

| Document                                         | Description                 |
| ------------------------------------------------ | --------------------------- |
| [**TESTING_GUIDE.md**](testing/TESTING_GUIDE.md) | Comprehensive testing guide |

**When to Use:**

- Testing the application
- Writing tests
- Verifying functionality
- QA process

---

## 🗂️ Documentation Structure

```
docs/
├── README.md (this file)
├── setup/              # Initial setup and deployment
├── agent/              # LiveKit agent configuration
├── architecture/       # System design and architecture
├── stripe/             # Payment and credit system
├── livekit/            # Real-time communication
├── ragie/              # Document management (RAG)
├── infrastructure/     # AWS, email, etc.
├── visa-types/         # Visa-specific guides
├── implementation/     # Implementation notes
├── security/           # Security patches and notes
└── testing/            # Testing guides
```

---

## 🔍 Finding What You Need

### "I want to..."

| Goal                            | Recommended Docs                                                               |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **Set up for the first time**   | [`setup/SETUP_GUIDE.md`](setup/SETUP_GUIDE.md)                                 |
| **Deploy to production**        | [`setup/PRE_DEPLOYMENT_CHECKLIST.md`](setup/PRE_DEPLOYMENT_CHECKLIST.md)       |
| **Change domain**               | [`setup/DOMAIN_UPDATE_GUIDE.md`](setup/DOMAIN_UPDATE_GUIDE.md)                 |
| **Set up payments**             | [`stripe/STRIPE_QUICKSTART.md`](stripe/STRIPE_QUICKSTART.md)                   |
| **Configure the agent**         | [`agent/AGENT_UPDATE_GUIDE.md`](agent/AGENT_UPDATE_GUIDE.md)                   |
| **Set up recording**            | [`livekit/LIVEKIT_RECORDING_SETUP.md`](livekit/LIVEKIT_RECORDING_SETUP.md)     |
| **Add a new visa type**         | [`visa-types/F1_INTEGRATION_SUMMARY.md`](visa-types/F1_INTEGRATION_SUMMARY.md) |
| **Understand the architecture** | [`architecture/FINAL_ARCHITECTURE.md`](architecture/FINAL_ARCHITECTURE.md)     |
| **Debug an issue**              | [`implementation/DEBUG_LOGS.md`](implementation/DEBUG_LOGS.md)                 |
| **Test the app**                | [`testing/TESTING_GUIDE.md`](testing/TESTING_GUIDE.md)                         |

---

## 📝 Documentation Guidelines

When adding new documentation:

1. **Choose the right folder** based on the topic
2. **Use descriptive filenames** in UPPERCASE with underscores
3. **Include a summary** at the top of each document
4. **Update this README** with a link to your new doc
5. **Use markdown formatting** for readability
6. **Include code examples** where applicable
7. **Add troubleshooting sections** for common issues

---

## 🤝 Contributing

Found an error or want to improve the docs?

1. Update the relevant document
2. Test any code examples
3. Update this README if you add new docs
4. Submit a pull request

---

## 📞 Need Help?

If you can't find what you're looking for:

1. Check the **[Quick Start](#-quick-start)** section
2. Search this README for keywords
3. Look in the **[Implementation Notes](implementation/IMPLEMENTATION_SUMMARY.md)**
4. Check the **[Debug Logs](implementation/DEBUG_LOGS.md)**

---

**Last Updated:** January 2026  
**Documentation Version:** 1.0
