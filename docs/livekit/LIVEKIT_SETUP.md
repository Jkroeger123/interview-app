# LiveKit Voice AI Integration Setup

This guide will help you set up the voice AI call functionality using LiveKit.

## Overview

The app includes a real-time voice interface that connects to LiveKit Agents, allowing users to have voice conversations with an AI assistant. The integration includes:

- Real-time voice communication
- Optional text chat during calls
- Microphone controls
- Secure, authenticated connections via Clerk
- Beautiful UI built with shadcn/ui components

## Prerequisites

1. A LiveKit account (sign up at [https://cloud.livekit.io/](https://cloud.livekit.io/))
2. A LiveKit Agent running (see below)
3. Your Clerk authentication already configured

## Step 1: Get LiveKit Credentials

1. Go to [LiveKit Cloud](https://cloud.livekit.io/)
2. Create a new project (or use an existing one)
3. Go to **Settings** → **Keys**
4. Copy these three values:
   - **WebSocket URL** (e.g., `wss://your-project.livekit.cloud`)
   - **API Key** (starts with `API`)
   - **API Secret** (starts with `secret`)

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Set Up a LiveKit Agent

You need a LiveKit Agent running to handle the voice interactions. Here are your options:

### Option A: Use a Pre-built Agent (Recommended)

LiveKit provides starter agents:

**Python Agent:**

```bash
# Clone the starter agent
git clone https://github.com/livekit-examples/agent-starter-python.git
cd agent-starter-python

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LIVEKIT_URL=wss://your-project.livekit.cloud
export LIVEKIT_API_KEY=your_api_key
export LIVEKIT_API_SECRET=your_api_secret
export OPENAI_API_KEY=your_openai_key

# Run the agent
python main.py
```

**Node.js Agent:**

```bash
# Clone the starter agent
git clone https://github.com/livekit-examples/agent-starter-node.git
cd agent-starter-node

# Install dependencies
npm install

# Set environment variables (create .env.local)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key

# Run the agent
npm start
```

### Option B: Deploy to LiveKit Cloud

LiveKit offers managed agent hosting:

1. Go to your LiveKit Cloud dashboard
2. Navigate to **Agents**
3. Deploy a pre-configured agent
4. No local setup required!

## Step 4: Test the Integration

1. Start your Next.js app:

   ```bash
   npm run dev
   ```

2. Make sure your LiveKit Agent is running

3. Log in to your app

4. Click "Voice Call" in the navigation

5. Click "Start Call"

6. Speak to test the voice interaction!

## Architecture

### How It Works

1. **User Authentication**: Clerk authenticates the user
2. **Token Generation**: The `/api/livekit/connection-details` route generates a secure LiveKit token
3. **Room Connection**: The client connects to a LiveKit room using the token
4. **Agent Join**: The LiveKit Agent automatically joins the room
5. **Voice Interaction**: Real-time voice communication happens between user and agent

### Component Structure

```
app/call/page.tsx                          # Main call page
├── CallInterface                          # Top-level component
    ├── CallWelcome                        # Start call screen
    └── CallSession                        # Active call UI
        ├── CallMessages                   # Chat/transcription display
        └── CallControlBar                 # Mic/chat/hangup controls
```

### API Routes

- `POST /api/livekit/connection-details` - Generates access tokens (protected by Clerk)

## Configuration Options

Edit `app/call/page.tsx` to customize the experience:

```typescript
const config: LiveKitConfig = {
  pageTitle: "Voice AI Assistant",
  supportsChatInput: true, // Enable text chat during calls
  supportsVideoInput: false, // Enable video (not implemented yet)
  supportsScreenShare: false, // Enable screen sharing (not implemented yet)
  isPreConnectBufferEnabled: true, // Start listening immediately
  agentName: undefined, // Specify a particular agent name
};
```

## Troubleshooting

### "Agent did not join the room"

**Solution**: Make sure your LiveKit Agent is running and has the correct credentials.

```bash
# Check agent logs for connection errors
# Verify environment variables match your LiveKit project
```

### "Connection Error" or "Unauthorized"

**Solution**:

- Verify your LiveKit credentials in `.env.local`
- Make sure you're signed in with Clerk
- Check that `LIVEKIT_URL` starts with `wss://`

### No audio / microphone not working

**Solution**:

- Grant microphone permissions in your browser
- Check browser console for media device errors
- Try a different browser (Chrome/Firefox recommended)

### Agent connects but doesn't respond

**Solution**:

- Check your OpenAI API key (or whatever LLM provider you're using)
- Review agent logs for errors
- Verify the agent has necessary API access

## Advanced Customization

### Custom Agent Behavior

Modify your LiveKit Agent code to:

- Change the AI personality/prompts
- Add function calling capabilities
- Integrate with your database
- Add custom business logic

### UI Customization

All components are built with shadcn/ui and Tailwind CSS:

- Modify colors in `app/globals.css`
- Edit components in `components/voice-call/`
- Add animations, transitions, etc.

### Agent Name Routing

To route to a specific agent:

```typescript
const config: LiveKitConfig = {
  // ... other config
  agentName: "my-specialized-agent",
};
```

## Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Agents Guide](https://docs.livekit.io/agents/)
- [Voice AI Quickstart](https://docs.livekit.io/agents/start/voice-ai/)
- [LiveKit Examples](https://github.com/livekit-examples)

## Support

- **LiveKit Issues**: [GitHub](https://github.com/livekit/livekit/issues)
- **LiveKit Slack**: [Join Community](https://livekit.io/join-slack)
- **Documentation**: [docs.livekit.io](https://docs.livekit.io/)
