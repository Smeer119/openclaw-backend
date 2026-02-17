# What You Need From Your Side - Checklist

Before we start deploying OpenClaw to AWS EC2, gather these:

## 1. AWS Account ✓
- [ ] Create AWS account at https://aws.amazon.com/
- [ ] Verify email
- [ ] Add payment method (won't be charged with free tier)

## 2. API Keys 🔑

### Gemini API Key ✅ (You already have this)
- [ ] Confirm it's still working
- [ ] Copy from `.env.local` in cortex folder

### Pinecone API Key 🆕 (Need to get this)
1. [ ] Go to https://www.pinecone.io/
2. [ ] Sign up (use same email as AWS for consistency)
3. [ ] Create new index:
   - Name: `cortex-memories`
   - Dimensions: `768`
   - Metric: `cosine`
   - Cloud: `AWS`
   - Region: `us-east-1`
4. [ ] Go to "API Keys" section
5. [ ] Copy the API key
6. [ ] Save it somewhere safe

### Clerk Secret Key 🔐 (You should have this)
1. [ ] Go to https://dashboard.clerk.com/
2. [ ] Click on your Cortex app
3. [ ] Go to "API Keys" section
4. [ ] Find "Secret keys"
5. [ ] Copy the key that starts with `sk_`
6. [ ] Save it

## 3. Database Password 🔒
- [ ] Think of a strong password for PostgreSQL
- [ ] Example: `OpEnCl@w2024!Secure#DB`
- [ ] Write it down securely
- [ ] You'll need this during setup

## 4. Computer Setup ✓
- [x] Windows with PowerShell (you have this)
- [ ] OpenClaw code in: `C:\Users\Asus\Desktop\cortex\openclaw`

---

## Summary - Copy These Values

Once you have everything, keep this info ready:

```
AWS Account: ________________
AWS Region: us-east-1 (or your preferred region)

Gemini API Key: AIza______________________________
Pinecone API Key: ________________________________
Clerk Secret Key (sk_): __________________________

PostgreSQL Password: _____________________________
```

---

## Time Estimate

- Getting API keys: 10 minutes
- AWS EC2 setup: 30 minutes
- Testing: 10 minutes
- **Total: ~50 minutes**

---

## When You're Ready

Tell me:
1. "I have all the API keys" - and I'll guide you through AWS setup
2. Or "I'm stuck on [X]" - and I'll help you get that specific thing

Let's do this! 🚀
