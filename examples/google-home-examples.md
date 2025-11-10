# Google Home Integration Examples

Real-world examples of using PAI with Google Home and Gemini AI.

## Setup

Ensure you have:
```bash
# In .env
GOOGLE_API_KEY=AIza...              # From https://aistudio.google.com/app/apikey
GOOGLE_HOME_IP=192.168.1.100        # Your Google Home's IP (optional for TTS)
```

## Basic Examples

### Query Gemini

**Simple question:**
```
User: Ask Gemini what's the capital of France
PAI:  Paris is the capital of France.
```

**Complex analysis:**
```
User: Ask Gemini to explain quantum computing in simple terms
PAI:  [Gemini provides detailed explanation]
```

**Current events:**
```
User: Ask Gemini about the latest AI developments
PAI:  [Gemini summarizes recent AI news]
```

### Speak to Google Home

**Simple announcement:**
```
User: Announce "Dinner is ready" on Google Home
PAI:  ✓ Announced on Google Home
      [Google Home speaks: "Dinner is ready"]
```

**Custom messages:**
```
User: Tell Google Home "The package has arrived"
PAI:  ✓ Sent to Google Home

User: Announce "It's time to leave for school"
PAI:  ✓ Announced
```

## Advanced Examples

### Multi-turn Conversations

**Research workflow:**
```
User: Ask Gemini to help me plan a trip to Japan

Gemini: I'd be happy to help! When are you planning to visit Japan?

User: In April next year

Gemini: April is a great time! Cherry blossoms will be in bloom.
        How many days do you have?

User: About 10 days

Gemini: Perfect! I recommend:
        - Tokyo (3 days)
        - Kyoto (3 days)
        - Osaka (2 days)
        - Hakone (2 days)

        Would you like detailed itineraries for each city?
```

**Learning session:**
```
User: Ask Gemini to teach me about machine learning

Gemini: Let's start with the basics. Machine learning is...

User: Can you give an example?

Gemini: Sure! Here's a simple example using email spam detection...

User: How does this differ from traditional programming?

Gemini: Great question! In traditional programming...
```

### Image Analysis

**Analyze photo:**
```
User: What's in this image? [uploads photo.jpg]
PAI:  [Using Gemini Vision]
      The image shows a sunset over the ocean with palm trees
      in the foreground. The sky has vibrant orange and pink hues.
```

**Identify objects:**
```
User: What breed of dog is this? [uploads dog.jpg]
PAI:  [Gemini Vision analyzes]
      This appears to be a Golden Retriever, approximately 2-3 years old.
```

**Read text:**
```
User: What does this sign say? [uploads photo]
PAI:  [Gemini Vision OCR]
      The sign reads: "Fresh Coffee - $3.50"
```

### Home Automation

**Morning routine:**
```
User: Announce "Good morning! Time to wake up" on Google Home
PAI:  ✓ Announced

User: Ask Gemini for today's weather
PAI:  Today in San Francisco: Sunny, high of 68°F, low of 54°F

User: Announce the weather on Google Home
PAI:  ✓ Announced "Today will be sunny with a high of 68 degrees"
```

**Dinner time:**
```
User: Ask Gemini for a simple dinner recipe
PAI:  [Gemini suggests: Quick Pasta Primavera]

User: Announce "Dinner will be ready in 20 minutes"
PAI:  ✓ Announced on Google Home
```

**Bedtime:**
```
User: Announce "Bedtime in 10 minutes" on Google Home
PAI:  ✓ Announced

User: Ask Gemini to generate a bedtime story for kids
PAI:  [Gemini creates a short story]

User: Announce the story on Google Home
PAI:  ✓ Reading story via Google Home
```

## Skill-Based Examples

### Research Skill

```
User: Research the best practices for remote work

PAI: [Activates research skill]
     Using Gemini to gather information...

     Key findings:
     1. Establish dedicated workspace
     2. Maintain regular schedule
     3. Use video for important meetings
     4. Take regular breaks
     5. Over-communicate with team

     [Full research report]
```

### Development Skill

```
User: Ask Gemini to write a Python function that sorts a list

PAI: [Gemini generates]

     def sort_list(items, reverse=False):
         """Sort a list of items"""
         return sorted(items, reverse=reverse)

     # Example usage
     numbers = [3, 1, 4, 1, 5, 9, 2, 6]
     sorted_nums = sort_list(numbers)
```

## Integration Patterns

### PAI + Google Home + Automation

**Create automated announcements:**

```python
# External script
import requests

def announce_event(message):
    response = requests.post(
        'http://localhost:3000/api/chat',
        json={
            'message': f'Announce "{message}" on Google Home',
            'voiceEnabled': False
        }
    )
    return response.json()

# Use in automation
announce_event("Package delivered to front door")
announce_event("Meeting starts in 5 minutes")
announce_event("Laundry cycle complete")
```

### PAI + Gemini + Data Analysis

```
User: Ask Gemini to analyze this CSV data [uploads file]

PAI: [Gemini processes]
     I've analyzed the data. Here are the key insights:

     - Total records: 1,245
     - Average value: $42.50
     - Peak period: Q4 2024
     - Trend: +15% growth year-over-year

     Would you like me to explain any specific metrics?
```

### PAI + Vision + Home Monitoring

```
User: What do you see in my front door camera? [uploads snapshot]

PAI: [Gemini Vision]
     I see:
     - Person at the door
     - Wearing blue jacket
     - Holding a package
     - Time appears to be daytime

     Appears to be a delivery person.

User: Announce "Package at the front door"
PAI: ✓ Announced on Google Home
```

## API Examples

### Using cURL

**Query Gemini:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Ask Gemini what is 2+2",
    "agentType": "kai"
  }'
```

**Speak to Google Home:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Announce \"Hello World\" on Google Home"
  }'
```

### Using JavaScript

```javascript
// Query Gemini
async function askGemini(question) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Ask Gemini ${question}`,
      voiceEnabled: false
    })
  })

  const data = await response.json()
  return data.message
}

// Announce on Google Home
async function announceOnGoogleHome(message) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Announce "${message}" on Google Home`
    })
  })

  return response.json()
}

// Usage
const answer = await askGemini('What is the weather?')
console.log(answer)

await announceOnGoogleHome('Coffee is ready')
```

### Using Python

```python
import requests

def ask_gemini(question):
    response = requests.post(
        'http://localhost:3000/api/chat',
        json={
            'message': f'Ask Gemini {question}',
            'voiceEnabled': False
        }
    )
    return response.json()['message']

def announce_google_home(message):
    requests.post(
        'http://localhost:3000/api/chat',
        json={'message': f'Announce "{message}" on Google Home'}
    )

# Usage
answer = ask_gemini('Explain AI in simple terms')
print(answer)

announce_google_home('Test announcement')
```

## Troubleshooting

### "Google Home IP not configured"

```bash
# Find your Google Home IP
nmap -sn 192.168.1.0/24 | grep -i "Google"

# Add to .env
GOOGLE_HOME_IP=192.168.1.XXX

# Restart server
./quickstart.sh → Option 3
```

### "GOOGLE_API_KEY not set"

```bash
# Get API key
# Visit: https://aistudio.google.com/app/apikey

# Add to .env
GOOGLE_API_KEY=AIza...

# Restart server
./quickstart.sh → Option 3
```

### Google Home not responding

**Check 1: Same network**
```bash
ping 192.168.1.XXX  # Your Google Home IP
```

**Check 2: Port access**
```bash
# Ensure port 8009 is accessible
telnet 192.168.1.XXX 8009
```

**Check 3: Google Home app**
- Open Google Home app
- Verify device is online
- Check device name

## Tips & Best Practices

### Optimize Gemini queries

**Be specific:**
```
❌ "Tell me about cars"
✅ "Compare hybrid vs electric cars for city driving"
```

**Provide context:**
```
❌ "What should I do?"
✅ "I'm planning a birthday party for 20 people. What are some creative theme ideas?"
```

**Use follow-ups:**
```
User: Ask Gemini about machine learning
Gemini: [Explains ML]
User: Can you give a real-world example?
Gemini: [Provides example]
User: How would I get started learning this?
```

### Effective announcements

**Clear and concise:**
```
✅ "Dinner is ready"
✅ "Meeting starts in 5 minutes"
✅ "Package delivered"

❌ "Hey everyone, just wanted to let you know that dinner..."
```

**Time-sensitive alerts:**
```
announce_google_home("Timer expired - check the oven")
announce_google_home("Medication reminder - take pills")
announce_google_home("Doorbell - someone at the door")
```

### Multi-device coordination

If you have multiple Google Home devices, announcements go to all:

```
Announce "Good morning everyone!"
→ All Google Homes announce simultaneously
```

To target specific device (future enhancement):
```
Announce "Wake up!" on bedroom Google Home
```

## Example Automations

### Smart morning routine

```bash
#!/bin/bash
# morning.sh

# Get weather
WEATHER=$(curl -s http://localhost:3000/api/chat \
  -d '{"message":"Ask Gemini for weather"}' | jq -r '.message')

# Announce
curl -s http://localhost:3000/api/chat \
  -d "{\"message\":\"Announce '$WEATHER' on Google Home\"}"

# Get news summary
NEWS=$(curl -s http://localhost:3000/api/chat \
  -d '{"message":"Ask Gemini for top news"}' | jq -r '.message')

curl -s http://localhost:3000/api/chat \
  -d "{\"message\":\"Announce 'Top news: $NEWS' on Google Home\"}"
```

### Smart reminder system

```javascript
// reminder.js
const REMINDERS = [
  { time: '08:00', message: 'Time to wake up!' },
  { time: '12:00', message: 'Lunch break' },
  { time: '18:00', message: 'Dinner time' },
  { time: '22:00', message: 'Bedtime in 30 minutes' }
]

function checkReminders() {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)

  for (const reminder of REMINDERS) {
    if (reminder.time === currentTime) {
      announceOnGoogleHome(reminder.message)
    }
  }
}

setInterval(checkReminders, 60000) // Check every minute
```

## Advanced Use Cases

### Real-time translation

```
User: Ask Gemini to translate "Hello, how are you?" to Spanish
PAI:  "Hola, ¿cómo estás?"

User: Announce that on Google Home
PAI:  ✓ Google Home says: "Hola, ¿cómo estás?"
```

### Content generation

```
User: Ask Gemini to write a haiku about AI
PAI:  Silicon minds think
      Learning patterns from our world
      Future now unfolds

User: Announce that poem on Google Home
PAI:  ✓ [Google Home recites haiku]
```

### Educational assistant

```
User: Ask Gemini to explain photosynthesis for a 10-year-old
PAI:  [Gemini provides age-appropriate explanation]

User: Announce the explanation
PAI:  ✓ [Educationalcontent via Google Home]
```

---

For more examples and integration ideas, see:
- [PAI Documentation](../README.md)
- [Google Home MCP README](../mcp-servers/google-home/README.md)
- [Community Examples](https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions)
