# Testing Your Voice Assistant - Step by Step

## Prerequisites
- ✓ App is deployed or running in preview
- ✓ You are logged in to TailorPal
- ✓ You have access to a shop (as owner or staff with voice permissions)

---

## Quick Test (2 minutes)

### Test 1: Basic Greeting
1. Open your TailorPal app
2. Go to **Voice Assistant** (either floating button or shell)
3. Say or type: **"Hi"**

**Expected Response:**
- Should greet you and offer help with shop operations
- Example: "Hello! How can I help you manage your tailor shop today?"

**If you get:**
- ✗ "I did not catch that clearly" → Fixes didn't apply, refresh page (Ctrl+F5)
- ✓ A conversational greeting → Success! Fixes are working

---

### Test 2: Shop Operation Question
1. Say: **"How can I add a customer?"**

**Expected Response:**
- Should explain the process of adding a customer
- Example: "To add a customer, just say 'add customer' and I'll guide you through it..."

**If you get:**
- ✗ "I did not catch that clearly" → See troubleshooting below
- ✓ A helpful explanation → Success!

---

### Test 3: General Knowledge
1. Say: **"What are standard tailoring measurements?"**

**Expected Response:**
- Should provide general knowledge about tailoring measurements
- Example: "Standard measurements include chest, waist, inseam, shoulder width, sleeve length..."

**If you get:**
- ✗ Error or no response → Check internet connection, try again
- ✓ Informative answer → Success!

---

### Test 4: Shop Operation (Real Action)
1. Say: **"Add customer"**

**Expected Response:**
- Should start the add customer flow
- Will ask for customer name
- Can continue with: "John Smith"

**Expected Follow-up:**
- Asks for phone number (or email)
- Can say "skip" to skip optional fields

---

## Detailed Test Suite

### Group A: Basic Responses

| Command | Expected Behavior | Status |
|---------|---|---|
| "hello" | Friendly greeting | |
| "hi" | Friendly greeting | |
| "how are you?" | Friendly response | |
| "thanks" | Acknowledgment | |
| "what can you do?" | List capabilities | |

### Group B: Shop Operations

| Command | Expected Behavior | Status |
|---------|---|---|
| "add customer" | Start add customer flow | |
| "create order" | Start create order flow | |
| "add measurement" | Start measurement flow | |
| "list customers" | Show customers | |
| "pending orders" | Show pending orders | |

### Group C: Questions

| Command | Expected Behavior | Status |
|---------|---|---|
| "how many customers do I have?" | Show total customers | |
| "what orders are pending?" | Show pending orders | |
| "tell me about my shop" | Shop summary | |
| "what's my customer name?" | Ask which customer | |

### Group D: Corrections (New Feature!)

| Command | Expected Behavior | Status |
|---------|---|---|
| "add customer" → "John" → "no wrong" | Ask for correction | |
| "add customer" → "John" → "actually it's Jane" | Accept correction | |
| "add customer" → "John" → "change it to Jane" | Accept correction | |

---

## Troubleshooting

### Issue: "I did not catch that clearly"

**Cause:** Fixes not applied or page not refreshed

**Solution:**
1. **Hard refresh your browser:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Wait 5-10 seconds for app to reload
3. Try saying "hi" again

### Issue: Long delay (5+ seconds) before response

**Cause:** First Groq API call is initializing

**Solution:**
- This is normal on the first call
- Subsequent calls should be faster (<1 second)
- If persistent, check your internet connection

### Issue: Voice not recording

**Cause:** Microphone permissions issue

**Solution:**
1. Check browser microphone permissions
2. Go to Settings → Privacy → Microphone
3. Make sure TailorPal has permission
4. Refresh page and try again

### Issue: No sound in response (if audio enabled)

**Cause:** Speaker or audio not configured

**Solution:**
- Check browser volume is not muted
- Check system volume is on
- Check if audio response is enabled in settings

### Issue: Responses seem generic or unhelpful

**Cause:** Shop context not loaded properly

**Solution:**
1. Add a few customers to your shop first
2. Try again - responses will be more contextual
3. Check browser console (F12) for errors

---

## What Should Work Now

After applying fixes, these should all work:

✓ General greetings and conversations
✓ Questions about shop operations
✓ General knowledge questions
✓ Shop-specific questions (pending orders, customers, etc.)
✓ Starting shop operation flows
✓ Correcting values with "no", "wrong", "change it to..."
✓ Multi-turn conversations (context remembers previous messages)
✓ No crashes even with zero customers

---

## Performance Expectations

| Action | Expected Time | Notes |
|--------|---|---|
| First response | 1-3 seconds | Initial API call slower |
| Subsequent responses | <1 second | Cached and fast |
| Starting a flow | <500ms | Local processing |
| Completing a flow | 1-2 seconds | With LLM confirmation |

---

## Reporting Issues

If something doesn't work after testing:

1. **Note the exact command you used**
2. **Note the exact response you got**
3. **Check browser console (F12 → Console tab) for errors**
4. **Check if there are red errors in the Network tab**

Then provide this information when reporting the issue.

---

## Next Steps

Once testing is complete:

1. ✓ Share with your staff
2. ✓ Train them on voice commands
3. ✓ Use it daily for shop operations
4. ✓ Provide feedback on what works well

See `VOICE_ASSISTANT_GUIDE.md` for complete documentation.
