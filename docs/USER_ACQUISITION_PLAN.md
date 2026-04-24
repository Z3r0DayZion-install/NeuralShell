# NeuralShell User Acquisition Plan

**Goal:** 3 real users in 14 days  
**Constraint:** No new features. Only outreach.  
**Success Metric:** 3 people who install and give feedback

---

## Week 1: Find & Message 20 People

### Day 1-2: Build Target List

**Target Personas (in order of priority):**

1. **Security-conscious developers** who complain about cloud AI
2. **Crypto/DeFi builders** working on sensitive systems
3. **Homelab/air-gap enthusiasts** running local AI
4. **Compliance/security officers** at small fintechs

**Where to find them:**
- Twitter: Search "privacy concerns cursor" "don't trust copilot"
- Mastodon: infosec.exchange, hachyderm.io
- Reddit: r/homelab, r/selfhosted, r/crypto, r/privacy
- GitHub: Issues on Ollama, LocalAI, projects mentioning "air-gapped"
- Discord: Homelab, CryptoDevs, Security communities

**Target: 20 people by end of Day 2**

### Day 3-5: Send Personalized Messages

**Template A - Twitter/Mastodon (Direct Response to Post):**
```
Hey @username - saw your thread on [specific thing they said]. 

Built NeuralShell to solve exactly this: local AI with hardware-bound sessions. 

Not asking for a beta test - just curious if this matches what you're looking for?

[GitHub link]
```

**Template B - Reddit (Reply to Relevant Post):**
```
I've been working on something similar: NeuralShell.

Key difference: sessions are hardware-bound (encrypted with CPU/BIOs fingerprint). So they survive OS reinstalls but won't work if you try to restore on different hardware.

Would this solve the problem you're describing?
```

**Template C - Discord (DM after establishing presence):**
```
Hey - saw you've been working with local LLMs. 

I built NeuralShell which adds hardware-bound session management on top of Ollama. Think: encrypted sessions that restore only on your original machine.

Wanted your take as someone who actually runs local AI - does session management matter to you?
```

**Target: Send 20 messages by end of Day 5**

### Day 6-7: Follow Up & Qualify

**Response Rate Expectation:** 20-30% (4-6 replies)

**When someone responds positively:**
```
Awesome! Want to try it? I can walk you through setup over Discord/Zoom - takes ~10 min.

What OS are you on?
```

**When someone is skeptical:**
```
Totally fair. The hardware binding is the part that sounds weird - happy to explain how it works or just send you the installer and let you verify it yourself.

What would you need to see to give it a shot?
```

**Target: 3 people interested by end of Week 1**

---

## Week 2: Onboard & Learn

### Day 8-10: Personal Onboarding

**For each person who wants to try:**

1. **Send installer link** (GitHub releases)
2. **Offer to screenshare** for setup (Discord/Zoom)
3. **Watch them use it** - don't explain, observe
4. **Ask specific questions:**
   - "What part was confusing?"
   - "What did you expect to happen that didn't?"
   - "Would you use this daily? Why or why not?"

### Day 11-12: Fix Blockers

**If they can't install →** Debug together, document issue
**If feature is missing →** Note it, don't promise to build yet
**If they don't see value →** Ask what WOULD be valuable

### Day 13-14: Decision Point

**If 3+ people using it daily:**
- Double down on user acquisition
- Build their most requested feature
- Start thinking about monetization

**If <3 people or no daily usage:**
- Pivot target audience (try enterprise security instead of indie devs)
- Pivot product (maybe it's an API/library, not an app)
- Or kill it and apply lessons to next project

---

## Tracking Spreadsheet

| Name | Source | Date Contacted | Response? | Interested? | Installed? | Using Daily? | Blocker | Notes |
|------|--------|----------------|-----------|-------------|------------|--------------|---------|-------|
| | | | | | | | | |

**Update daily. Be honest about "no response" vs "not interested."**

---

## Daily Schedule

**Days 1-5:**
- Morning: Find 4-5 new targets (30 min)
- Afternoon: Send 4-5 messages (30 min)
- Evening: Update tracking spreadsheet (10 min)

**Days 6-14:**
- Morning: Respond to any replies (15 min)
- Afternoon: Onboard new users (30 min per user)
- Evening: Document learnings (15 min)

**Total time commitment: 1 hour/day for 14 days**

---

## Success Criteria

**Win:** 3 people using NeuralShell daily by Day 14
**Pivot:** 1-2 people interested but different use case emerges
**Kill:** 0 people interested after 20 outreach attempts

---

## Emergency Tactics (If Week 1 Fails)

**Tactic 1: Paid Micro-Influencer**
- Find YouTuber with 5k-20k subs who reviews privacy tools
- Offer $100 for honest review
- Give them affiliate link for any future sales

**Tactic 2: Hacker News via Proxy**
- Find friend with HN account
- They post, you write the comment
- Split attention however you want

**Tactic 3: Direct Competitor Poaching**
- Go to Cursor/Claude/Copilot Discord
- Find people complaining about privacy
- DM them directly

**Tactic 4: Build in Public**
- Post daily on Twitter/Mastodon about building it
- Tag relevant people (@ollama, @localai, etc.)
- After 2 weeks, you'll have small audience to launch to

---

## What NOT to Do

❌ Don't build new features  
❌ Don't redesign the landing page  
❌ Don't write blog posts (unless they directly target users)  
❌ Don't wait for "perfect moment" to launch  
❌ Don't spam generic messages  

**Focus: Find 20 people who have the problem. Convince 3 to try it. Learn from them.**

---

## Resources

**Search queries for finding targets:**
- "cursor ai privacy concerns"
- "copilot not sending code to cloud"
- "ollama session management"
- "air gapped llm"
- "local ai no internet"

**Communities to join:**
- Homelab Discord
- CryptoDevs Discord  
- infosec.exchange (Mastodon)
- r/selfhosted

**Tools:**
- Google Sheets for tracking
- Discord for user support
- Loom for async demo videos
