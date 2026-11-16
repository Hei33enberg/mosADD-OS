# mosADD changelog

Every mosADD release that reached production, newest first: the website and web app (**Web**), the server (**Server**) and the apps you install — Windows, Android, macOS, PWA (**Apps**).

Live page: https://mosadd.com/changelog · JSON: https://mosadd.com/changelog.json

<!-- Generated from apps/web/src/data/changelog.ts by scripts/changelog-lustra.mjs. Do not edit by hand. -->

## 2026-11-16 — Web · Server

**mosADD 2.1.0 — launch build: the dashboard is back to your conversation threads only, push-to-talk lives in the mKEEPER window, and the writing bar keeps one order everywhere.**

- The home page animation is the original mRAG brain from the first version — the dotted brain inside the turning graph of 64 nodes — standing big on the right with the headline and buttons on the left; the 3D engine is gone from the first screen. The page header is transparent only at the very top; once you scroll it gets the page's dark background with a thin line, hides when you scroll down and comes back when you scroll up, so it never sits on the content without a background, and "Skip to content" shows only when you reach it with the keyboard. The rows of people, agents and robots are back under the headline, and the page header stays transparent over the first screen. The mAYL page tells the whole story in 21 languages: a mailbox for your agent in one call, opens and clicks, control after sending, a signed audit report and the 16 mAYL tools. The browser tab of the home page now reads "mosADD — 1-MAN-ARMY OPS DECK" in every language. The Terms of Service and the Privacy Policy are rewritten for the launch, in English, under Swiss law: who runs mosADD (Fondation Proton, Plan-les-Ouates), exactly what is end-to-end encrypted (only direct messages between two people) and what our server can read, who processes your data and where (our own server in Tel Aviv rented from Vultr, encrypted backups in Mumbai, the voice, mail, AI-model and error-report providers), and what you can ask of us; the page footers now name the operator.
- The dashboard is back to your conversation threads only: yesterday's NEEDS YOU tab and band, the row of agents above the wall, the push-to-talk bar under the wall, the Approve button on cards and the shorter card previews are gone, the + button is back in its corner, and the cards lost their outline frames and glow to sit directly on the deep radar background — unread conversations show a bold name and a count. Cards no longer shrink and grow back on their own when the wall refreshes or a conversation is marked read, and a message in another section no longer rebuilds the wall you are looking at. The wall of threads appears sooner: the conversation, channel, mail and call windows now load quietly in the background once the wall is on screen, instead of before it. An agent's reply without a thread name lands in the thread where you last wrote to it. The / menu is shorter and clearer: in a chat with an agent its own commands always come first (status of the work, start a new task, stop), then this chat's actions — attach a file, search memory, ask mADD — and all mosADD tools sit in one row you can open; Telegram commands show only in channels connected to Telegram.
- Inside the conversation windows the writing bar has one order everywhere: ATTACH first, then push-to-talk or the text field, then the switch between them, then SEND — in mKEEPER, in every direct chat (which can now switch to push-to-talk too) and in mTALK, where MUTE moved to its own row above the bar. The bar in a direct chat is one line high again and sits fully on screen, also in the desktop app: its short hint no longer wraps and pushes the bottom of the bar out of the window. In the conversation window the message bubbles and the header sit frameless, the mTXT, mTALK and mAYL tabs sit on one thin line, and the writing bar — in direct chats and now in channels too — is light, with no frames between its cells and no glass around push-to-talk; the menu on a single message stays dark like every other menu. Every new message now plays the same one mosADD sound, whichever channel or agent it comes from. The ⋮ menu of mKEEPER is now three big rows on one level — PTT button, TEXT button and Memory & files — the same start as the ⋮ menu of a chat — and the PTT button can sit along the bottom (as before) or as a vertical rail on the left or right edge of the notebook, the same rail as in direct chats. Every ⋮ menu is now a single flat list — no rows hidden under other rows: in the PTT button row one tap switches to the next position, voice speed and volume in channels are rows of their own, the card menu's mute, snooze and colour and the mail menu's snooze are rows instead of sub-lists, message actions stand one under another, and blocking asks in its own small window. On a phone the name stands once, next to the close button. Settings and menus name the products mDM, mIRC, mAYL and mosADD.
- The new mosADD logo is in: the m and the turning sun wheel come from the mot3r mark, s, A and D are drawn with the same single stroke on one grid, with the top of the s on the crossbar of the A, and the sun in the middle is green. It sits in the header of the home page, every other page and the app, on the sign-in screen and on the TV screen, sized to whole pixels and centred on the menu pyramid; only the wheel turns once when you point at it. The home page is now one living network that fills the whole first screen, with the headline, the buttons and the connect commands lying on top of it: every message is a pulse of light that runs along a fibre from a person, an agent or a robot through the mDM, mIRC, mAYL or mTALK channel into the mRAG memory core, which breathes each time it saves one; agents answer with pulses of their own, a push-to-talk message is a short wide wave, and mADD only answers when asked. Drag or swipe to turn the network, hover or tap anyone to see their role and last action, tap a channel to light up its traffic, and tap an empty spot to send a message of your own into the flow. With reduced motion you get a still frame with the routes lit, and on a phone the scene is lighter and pauses when it is off screen. The home page no longer shows the humans / agents / robots counters or a memory counter: nothing on the page reads your data, so it does not make a number up. “Connect your AI” lists Claude Code, Codex, Cursor, VS Code, Gemini CLI and Windsurf, and copies the command for the one you pick. Its list now always fits the window: it opens upward when there is no room below, scrolls inside, shows each command once, and long commands scroll sideways in their own field with a copy button on every row. The pricing page and the menu now say it plainly: free at launch, no subscriptions — the old plans and per-agent prices are gone, and the header no longer offers a plan button. The mRAG page is rebuilt: what goes into your memory, what never does, and how search works. New mADD and mKEEPER pages: how to call your admiral, its ready tasks and the CONFIRM card, and your own notebook that stays quiet until you call @mADD. The About, Pricing, Docs and Quickstart pages are rebuilt from scratch in the look of the home page: the same header, menu and footer, numbers with a measurement behind them, a plain list of what is not there yet, and questions that fold open. The Pricing, Install, Help, mRAG, mADD, mKEEPER, MCP, Contact and About pages and the six comparison pages now also come in 21 other languages, from Polish and German to Japanese, Arabic and Khmer, and choosing a language in the menu keeps you on the page you are reading; the other pages are in English. The footer is now one short map of the site: every link opens a page that exists, and both connect commands copy with one tap. The changelog page is now a plain dated list: every release since 15 Aug 2026, newest first, grouped by month, each with its date, what it touched and a link to its commit on GitHub; the hero buttons, the dotted timeline and the counters are gone. The old Security and Agent pages are gone: their addresses lead to the home page. Contact is rebuilt around a live public room where you can ask without an account, with the email form folded underneath. Six comparison pages are rebuilt twice over: mosADD vs Signal, WhatsApp, Telegram, Discord, Slack and Zello, each with a one-line verdict, a table that lists only the rows where mosADD does what the other app does not, three cards and numbered sources checked on 16 Nov 2026. The MCP page is rebuilt from scratch: all every tool of @mosadd/mcp by family, a checked setup line for six AI clients, the hosted address, the local package, where to get a key, and how the / menu uses the tools. The pricing page is now a price list: one $0 card with what an account gets today, and a table of what the same setup costs on Slack, Telegram, WhatsApp and Discord, every rival figure with its source. The line under the home page headline types itself out again, on a phone as well as on a computer, and always finishes the whole sentence. Opening Install, mRAG, mADD or mKEEPER from the menu inside the app now shows the same page as the website instead of an old screen or a 404. The footer on the home page and every other page is now a small block: one row of links, one bottom line, and no second logo. The Install page now has the download buttons on the left and a scan-with-your-phone code on the right, with the current version numbers below and a link to sign in this screen from your phone. The Docs page now explains the / menu: its four groups, which tools ask you to confirm first, and how an agent adds its own commands. Help now explains how to sign in a second device with your phone and how to use a TV as a big screen. The footer of every page now has Android and Windows download buttons next to the Install the app link, each with its file size. The pricing page is one plain page: a $0 card with eight limits in human units (2 agents, 10,000 posts and 30 minutes of push-to-talk a month, 100 MB of memory) and one table against Slack, Telegram, WhatsApp and Discord, readable on a phone without sideways scrolling, in 21 languages, Pricing is now the first link in the footer's Company column, and the footer's app buttons have room to breathe, with macOS, iOS and Linux shown as Soon, a Download link above them, and the MCP footer link opens the MCP page while its icon copies the connector address.
- In the demo, mADD in the mKEEPER window answers "@mADD who is waiting for me" with the names of the threads waiting for you within a second, however a phone keyboard typed the @, and its reply is never an empty bubble. A channel's menu is one flat list with large rows and no second level: where the push-to-talk button sits comes first, then the Text button, search, members and invite; machine voice and mute are switches; leaving or deleting the channel sits at the very end. A channel card on the wall offers just pin, mark as read, mute and archive. When agent coordination or connected apps are briefly unreachable, mosADD says so in one line and stops retrying in the background instead of filling the screen with errors. An open channel now receives new messages live straight away, instead of waiting and retrying for many seconds, and it first loads its latest 20 messages, with older ones following as you scroll up; a very large message no longer slows the channel down each time the window updates. mADD now always answers in the language you write to it, skips an AI model that was no longer available instead of stalling on it, and records how fast each answer starts. Pressing and holding a thread on the wall, in channels and in direct chats, opens its menu again — on a phone it slides up from the bottom with large rows, and letting go no longer opens the thread by mistake. In the demo you can also ask mADD what it can do, who is stuck, to search your notes or to sum up your day — in English or Polish — and asking it to tell an agent something now shows a CONFIRM / LEAVE card first, with a pretend reply from the agent after you confirm; mADD's replies are signed. On a phone, the demo now opens on the wall with one line telling you what to do, and the home page menu is ready in the background moments after the page loads. On the wall, the time above a channel card now lights up as soon as the agent you addressed with @ (or, if you addressed no one, the channel's first agent) has read your latest message there. The sign-in page now matches the rest of mosADD: dark, with the dotted wordmark and its green light. mKEEPER is your notebook again: mADD answers only when you call it with @mADD there (or start a voice note with its name), or when you write to it directly; plain notes, voice notes and channel posts no longer wake it. Recruit now sits at the very end of the menu, and the recruiting page opens the same menu as the home page. The menu itself is now short and simple — an icon and a plain label per row, no section headings, links only to pages that exist today — and on a phone it slides up from the bottom, with its handle and close button staying put while the list scrolls. Every ⋮ menu and the long-press card menu are now always dark, also when your phone is set to a light theme; a channel's ⋮ menu has icons again, a search entry, its name shown once, and plainer items: Report channel…, Leave channel…. The mRAG icon in the app header now stays still at rest and moves only while something is happening — a search or memory that is actually being processed. The conversation and channel windows are lighter: the mTXT, mTALK and mAYL tabs and the writing bar are now set apart by one thin line instead of boxes, the push-to-talk key has no frame at rest, and on Android the writing bar sits just above the system navigation bar. Footers no longer link to pages that are gone (security, system facts, threat policy). The menu no longer links to GitHub — Docs is the way in, and the repository stays in the footer. New accounts start with $1 of fuel. In a chat with mADD its menu has one Edit mADD row that opens a separate panel for its picture, description, context and memory; the mKEEPER notebook menu no longer mixes in mADD settings. On a phone a chat menu shows the chat name once. The Install page is rebuilt: one big button for the device you are on (Android app, Windows installer, or the web app in your browser, including on iPhone), the other ways small underneath, and a QR code on a computer to install on your phone. The Help page is new too: ten short answers on getting started, adding an agent, mKEEPER, mADD, push-to-talk, what is encrypted, what it costs, where your data lives and how to delete your account. In a channel, the slash menu is now short like in direct chats: This channel has Attach a file, Search memory and Ask mADD, your tools sit in one row, and the list never runs past eight rows. A direct chat menu is the same single flat list: push-to-talk position and the Text button on top, then memory and files, call and new thread; machine voice, the contact badge and a mute switch follow, with hide and block at the end. An agent line status shows in its pilot row and refreshes by itself when the menu opens. In the live demo, mADD now stands on the wall as its own conversation next to mKEEPER: it answers every line you write there and shows its ready-made tasks straight away, while mKEEPER stays your notebook. A voice note sent to mADD in the demo gets a plain answer too: the demo does not turn speech into text, so mADD says so and points you to typing or a ready-made task. Memory search answers in under a second too: searching your mRAG memory, listing its sources and opening the connectors list now come from a compact index, a search that runs long returns what it found so far marked as partial instead of an error, and the same item no longer shows up twice. You can now sign in a computer, browser or TV with your phone: open mosadd.com/link on the new screen, scan its code with your phone (or type the six characters), check the device name and tap Approve. No passphrase is typed on the new screen, the code lasts two minutes and works once, and encrypted direct messages between two people stay locked there until you unlock them with your passphrase. A TV mode is here: open mosadd.com/tv on a TV or big screen, sign it in with your phone, and it shows your conversations, one channel in large type that scrolls by itself with a large name of whoever is talking, or the demo. Pick what the TV shows from your phone at mosadd.com/tv/remote, and move around with the remote arrows. Press Turn on sound to hear push-to-talk live on the TV. In the live demo on a computer, the first click on a conversation card now always opens it, even while the demo camera is moving between channels. The TV only listens: it can never send sound into the channel. On the server, mADD can now answer through a new engine for a single account at a time; the switch is off by default, so nothing changes for you yet. On that new engine mADD can now offer to send a message to one of your agents or open channels, save an mKEEPER task, change its status or hand it to an agent — each only as a CONFIRM / LEAVE card in your mADD chat, run by the server only after you tap CONFIRM, with a receipt line afterwards; it also shows when it is typing. It is switched on for one account today. The mKEEPER notebook window is back to its previous layout: the search bar with switches, the Files grid, the Tasks board, note pages, and the Deleted notes and Clear notebook entries in its menu are removed. A chat with mADD now says plainly under its name that it is not end-to-end encrypted — mADD reads what you write so it can answer; tap the line for a one-sentence explanation. Say mADD at the start of a voice note in mKEEPER and mADD answers it like a typed request. Turn on the reader in the mADD conversation menu and mADD's answers are read aloud, in mKEEPER too. @mosadd/mcp 3.0.0 is out, the first stable release of the 3.0 line: `npx -y @mosadd/mcp` now installs it. The Docs page no longer asks you to set a host by hand for a local run. The About page is now a short company page with the 3D network, facts with icons and real demo screenshots: what mosADD is, what we promise, where it runs, how to reach us. Push-to-talk is described as mTALK on new mDM and mIRC pages, and the old PTT link in the footer is gone. In Claude Code, one plugin now installs the mosADD tools, skills for talking to your team and posting status, and a channel that brings your channel and direct messages into the running session so it can answer back: claude plugin install mosadd@mosADD-OS (live channel messages need the development flag while Claude Code channels are a research preview; the exact commands are on /mcp). The recruit and install pages now say the same as the rest of the site: 85 tools, free at launch with no subscriptions, and no Mac download until it is ready. The demo also plays on its own: every few seconds it cycles through the looks the app already has — the palette, the mood equalizer, the font and the number of columns, one to four — with a small label saying what changed, and a tap, a click or a key stops it and keeps the look you have; with reduced motion it waits until you press Auto-show. Signing up stays free, with no email and no phone. When too many accounts are created at once, sign-up shows a short waiting list.

`7046317d1` · https://mosadd.com/changelog#2026-11-16

## 2026-11-15 — Web · Server · Apps

**One screen to start, mosADD installable everywhere, mKEEPER for your own notes and voice, calls that ring through — and a leaner, truer site with a changelog that covers every release.**

- The home page fits one screen on a phone — even a small iPhone with Safari's bars showing, with both buttons in view and the full tagline — and on a computer: a live 3D arena you can turn with your finger: stands of people, agents and robots, the channels mDM, mIRC, mAYL and mTALK as glowing pipes in their own colours, and every message flying down its pipe into the mRAG memory core at the centre, which visibly grows with each one; swipe sideways to turn it, swipe up or down to scroll the page, pinch with two fingers to look closer — the humans, agents and robots counters below it showing the same sample figures at the same time for everyone and growing about 1% a day, with agents always at least twice the people, a new logo drawn entirely in small round dots — the mosADD wheel with its green sun at the O, sitting on one dot grid with the letters and evenly spaced between every pair, the same in the header, the footer and the app — and the subtitle shown in full from the first moment, Join mosADD and See Demo, and a one-line developer start with `npx @mosadd/mcp`. Every page now shares the new logo, header and menu — on the home page the menu answers your tap at once and opens from the top, with the page staying put underneath — the home page footer names the MIT licence of the open-source toolkit, and the developer quickstart gives commands that work: connect at mcp.mosadd.com/mcp with a browser sign-in, or use a key from mosadd.com/keys as MOSADD_API_KEY. The home page counters stand on their own, without an extra caption underneath.
- Getting in: signing up is protected against bots without a CAPTCHA — while your vault is being created, your browser quietly solves a small proof-of-work, and each network gets a fair limit, so a whole office or phone network can still join together. Install mosADD from the website as an app on iPhone, Android and computers — one big button for the device you are on — with notifications reaching the browser and the installed app again — a browser left on an old notification key signs itself up again the next time you open mosADD — and macOS has a download again (two zips, Apple Silicon and Intel). The new /recruit page, opened from the menu, shows how to bring people in with a 20-second voice note and your mosADD link over WhatsApp, Telegram, SMS, mail or DM — free for humans.
- Your own stream is now mKEEPER: notes, files, GIFs and voice in one place, saved to your mRAG memory. mKEEPER stays a plain notebook — nothing answers unless you call @mADD — and mADD is also a separate contact in mDM — there from your very first minute, before any message; the empty notes box says how to call your admiral, tapping a ready-made task keeps what you typed, and in the demo no microphone prompt appears until you press push-to-talk, with ready-made tasks to tap (morning brief, who is waiting, my tasks, who is stuck, search my notes, hand this to an agent), sent in your own language — on a phone they sit in one row you swipe sideways. Write @mADD to ask your assistant — on every account, not only the first one: it answers right in your mKEEPER stream with your own memory, tells you which of your agents are waiting for you, which have gone quiet or are stuck and what each last said to you, and when it cannot answer it says why in one line instead of staying silent; ask it to pass something to one of your agents and a CONFIRM card appears in the stream — nothing is sent until you tap it, then it goes at once, and the agent's reply comes back into mKEEPER and closes the task; anything else stays a note. The mKEEPER ⋮ menu names the window once on a phone and labels which rows change mADD's look and settings. Push-to-talk sits in the same composer bar as in channels, and a stream you have read no longer lights up again when you reopen the app. On phones the keyboard no longer pushes the app under the header, and Send keeps working after you hide it. Agents searching your memory get the matching results straight away, with a generated summary only when they ask for one. Voice: push-to-talk to an agent now goes out live — the agent hears you and answers in the same chat, and agent lines that have it switched on also speak the reply aloud into the same PTT channel, with the radio sound and squelch you hear on voice notes; after you let go you see that the agent is thinking until its reply comes, and if you have left the channel by then, the spoken reply waits in the chat as a voice note that plays by itself when you come back — and the radio click sounds the moment your microphone is live — in direct chats, channels and notes to yourself — so your first word is never cut off; a call started by an agent rings the other side, phones wake up for calls and PTT, a named PTT room stays with its owner, and a voice note arrives with its transcript and the recording.
- On the mDM wall, a NEEDS YOU tab and a band at the top show the agents waiting for your decision, the longest wait first, each with how long it has waited; a row of your agents under the tabs, and each agent card, says in one word whether it waits for you, is active, dozing or silent, with the measured time — and on a computer they stand in their own column to the left of the wall; under the wall sits the same push-to-talk bar as in mKEEPER, so a held note lands in your stream without opening it; a question from an agent coordination channel has an Approve button right on its card, with a few seconds to undo, and card previews are shorter — three lines on a phone, six on a computer. Chats with agents work like Telegram: type / for one catalog — Agent, This channel, mosADD and your Apps, each with its own header, searchable by name and description, a tool you run shows its result, and in a channel the composer now sits above a phone keyboard, with every app folded into one line until you open it — and the commands an agent announces come first — /new starts a fresh session, /status, /stop, /model, /help — and Enter sends the command straight to the agent, with your connected apps' actions listed below; on plans with tool runs, mosADD's own tools for channels, mail, memory and rooms sit in their own section and run with your own permissions. Pictures sent in a chat or channel show as a preview with their caption underneath, and other files as a card with name, size and type. Press and hold any message in mDM, mIRC or mTALK for one short, consistent menu, and channel menus show only what works. A new message — text, voice or a file — lifts its conversation to the top of the wall and keeps it there. While mosADD is open, a new message also drops a small banner from the top that shows who wrote, where (mDM, a channel or mAYL) and a preview — for an end-to-end encrypted chat only who wrote — in the same look as the rest of the app: it fills the width of a phone and sits in the top-right corner on a computer; tap it to open the conversation, swipe it away, or let it fade after four seconds. Times read the same everywhere — 24-hour, in your language, in the same format on the wall, in chats and in channels; a channel opens at its newest message, its big button says PUSH TO TALK like everywhere else, and in the demo push-to-talk no longer asks for your microphone.
- A leaner, faster, truer app: mOPS and mARMS slide open without a blank screen and mARMS reopens with your lines already in place, open conversations stop flooding the server with read checks, mLIDAR and Voice Truthgate are paused for the first release (add-ons already bought stay in billing), the extension, mURL and AfterStream pages are hidden for now, every old demo link opens the one live demo, and the privacy pages say plainly that end-to-end encryption covers 1:1 conversations between people, while channels with an AI agent, files and mail are readable by our server. /security is now the one page for all of it, including where your data is stored — our own server in Tel Aviv, rented from Vultr, a US company — and /trust, /privacy and /terms lead to /security, the privacy policy and the terms. The footer on every page now says MIT (not Apache-2.0), end-to-end encryption for 1:1 between people, and iPhone as the web app it is. The new-message sound and banner come only for a genuinely new message from someone else, and only once — for guests in channels, agent replies, mail and call entries too — the Windows app plays one sound per message, not two, and a vote on a channel decision no longer rings everyone; opening or using mosADD on a phone — the home page included — no longer lowers or pauses music from other apps, and the volume comes back by itself after a sound; the microphone opens only while you hold push-to-talk; when that conversation is open but scrolled out of view, the banner now shows who wrote, so a sound never arrives with nothing to see. On a phone the top of the app takes far less room: the demo bar is slimmer and your cards start right under the filters. The live demo now runs by itself: Watch mockARMY follows a simulated team of people, agents and robots through five project channels — also with Reduce Motion on — and Test yourself lets you click and type in the same world. In the demo, mADD always answers when you write @mADD, the message menu opens from the bottom, the demo channel has PUSH TO TALK with voice notes you can play together with their transcripts, and the attach sheet uses plain wording. Opening mosADD after an update no longer ends on a blank screen: a page your phone kept from before still gets the code it asks for, and if the code fails to load anyway, the app reloads itself once, straight away, instead of waiting 15 seconds.

`38b10d133` · https://mosadd.com/changelog#2026-11-15

## 2026-11-15 — Desktop 0.2.57 — Apps

**Desktop 0.2.57: from this version on, updating the Windows app keeps you signed in.**

- Updates from 0.2.57 onwards — automatic or by running a newer installer — keep you signed in and keep your end-to-end encryption keys. Updating to 0.2.57 itself still runs the old cleanup, so sign in once more after this update.
- The app's built-in agent reaches mosADD through the current server address again.
- Download mosADD-Setup-0.2.57.exe or the portable build from mosadd.com/install. The Android app stays at 2.0.23.

`4cb993cc8` · https://mosadd.com/changelog#v0.2.57

## 2026-11-14 — Web · Server

**A one-screen home page, a Connect button for your AI, and push-to-talk voice back on.**

- The home page is now one screen: the headline, a live 3D graph of people and agents talking, and the way in.
- Connect your AI: Claude and other MCP clients link to your mosADD account through a normal sign-in and consent screen at mcp.mosadd.com — no key to copy. If you have an agent, it connects as that agent by default; one tap switches it to you.
- Push-to-talk is back: PTT channels and mDM calls carry live voice again, and PTT messages are transcribed on our own server — no Google, no OpenAI.
- An agent's mail follows the agent: when an identity moves to another account, its @mosadd.com address and every new mail move with it.
- Sign-in and password-reset emails are sent through Resend.

`c811effb1` · https://mosadd.com/changelog#2026-11-14

## 2026-11-13 — Web

**A leaner app: unfinished features step aside, and dozens of rough edges are gone.**

- mLIDAR, Voice Truthgate and mCALL are hidden in the app until they are ready, instead of standing there as half-open doors.
- mRAG: the totals sit above the graph instead of on top of it, node labels stay readable and stop colliding, and counts read “1 chunk”, not “1 chunks”.
- Channels, mDM and mOPS: a failed first load shows one clear Retry instead of stacked error bars, and switches whose state is unknown stay disabled instead of guessing.
- Public pages on a phone: legal tables fold into readable cards, long addresses wrap instead of being cut off, and email addresses are tappable.

`c141901fc` · https://mosadd.com/changelog#2026-11-13

## 2026-11-12 — Web · Server

**Faster pages, fresh conversations up front, and channel commands in the composer.**

- Pages load faster: our own server caches static files and preloads what the first screen needs.
- A new message, mail or channel post lifts its card right behind mADD on the wall, so fresh conversations stay in view.
- Type / in mDM or mIRC to check the status of the Telegram, Slack, Discord and WhatsApp bridges, or to open Telegram setup in one step — no tokens pasted into chat.

`b085cefc6` · https://mosadd.com/changelog#2026-11-12

## 2026-11-11 — Web · Server

**mAYL opens at once, and agents get clean addresses.**

- mAYL on desktop no longer sits on “Still loading” for half a minute: the list loads light, and each message body loads when you open it.
- When your plan can't send a mail, mAYL says why in plain words instead of a generic error.
- New agents get a clean address like name@mosadd.com instead of a name with random letters attached.
- Retiring an agent revokes its keys and its channel access, and creating an agent under a taken name replaces the old one cleanly instead of making a duplicate.

`7e3942aa4` · https://mosadd.com/changelog#2026-11-11

## 2026-11-10 — Web · Server · Apps

**mDM feels live: instant typing dots, read marks and replies that never go missing.**

- Typing dots appear the moment the other person types, and your messages turn green as soon as they are read.
- An open conversation re-checks for new messages every few seconds, so a dropped live connection can no longer hide a reply.
- The channel menu stays on the module you are in, and archived channels stop lighting the unread dot.
- Android: the app from mosadd.com (2.0.23) signs in with your PIN again. Windows: the auto-update feed serves the real 0.2.56 build.
- Agent sign-up through the API confirms the email address with a link, and signing up twice no longer reveals whether an address is already registered.

`121a37717` · https://mosadd.com/changelog#2026-11-10

## 2026-11-08 — Desktop 0.2.56 — Web · Server · Apps

**Desktop 0.2.56 and one simple price list: $0, $15, $33.**

- One price ladder everywhere — in the app, in the embed and at checkout: $0, $15 and $33. The older pay-as-you-go and tier prices are gone.
- Windows desktop 0.2.56 is the build on the download page.
- A calmer top bar: the notification bell is gone from the header.
- Server hardening: guest links to channels fail closed, private live channels check membership before anyone can listen, and server-side fetches can no longer be pointed at internal addresses.

`c80955361` · https://mosadd.com/changelog#v0.2.56

## 2026-10-30 — Web

**mosadd.com is open to everyone again.**

- From 23 Oct the site stood behind a password while the app moved to our own server. The lock came off on 30 Oct, and mosadd.com answers for everyone again.
- The copy of the site in the second location was rebuilt without the lock, so a switch to the copy cannot bring the password back.

`89c405667` · https://mosadd.com/changelog#2026-10-30

## 2026-10-26 — Server

**A server review after the move: old addresses replaced, rate limits count the caller's real address.**

- Four server functions still called the old backend's address. They now call api.mosadd.com, and a scheduled job that had been knocking on a dead address runs again.
- The channel event log has its route back. The app had been calling it and getting a 404.
- Rate limits count the real address of the caller behind our proxy. A forged header no longer gets around them.
- Scheduled jobs and admin-only functions check who is calling before they do anything, and one leftover public function from the old setup was removed.

`a7b8c4c10` · https://mosadd.com/changelog#2026-10-26

## 2026-10-24 — Web · Server

**mosADD runs on our own server.**

- The app now talks to api.mosadd.com on our own server in Tel Aviv, instead of the hosted backend it was built on. The web build that makes the switch went live on 24 Oct.
- Deleting a channel now ends everyone's membership in it on the server, so counters and re-joining behave.
- mADD's reply streams in smaller pieces: every 150 ms instead of 450 ms.

`a3f46a152` · https://mosadd.com/changelog#2026-10-24

## 2026-10-06 — Web

**The home page tour, rebuilt: one scene per section, real recordings, less text.**

- Every section of the home page has one scene: real recordings of the app and 3D scenes instead of still images. Boxes and frames are gone from all fifteen sections.
- Less text on the page, rebuilt in all 25 languages.
- On a phone the recordings are readable and lighter, and a scene stays in place until its last point has scrolled past.
- The counters in the tour are labelled "sample fleet", never "live".

`13f17430c` · https://mosadd.com/changelog#2026-10-06

## 2026-10-05 — Web · Server

**Push-to-talk gets a queue and a 30-second limit, mentions reach the agent you named, and the app stops showing someone else's error page.**

- If the network hands the app a page that is not ours, the app shows a short "connecting…" screen and keeps its last good version, instead of someone else's error page.
- The mosADD sound plays once when you open the installed web app. Before this fix it either did not play at all or played three copies at once on the home page.
- In the demo, PUSH TO TALK records on your device and the note lands in the thread. Nothing is sent.
- Voice channels: only an active member of a push-to-talk channel can queue for the microphone, one transmission lasts at most 30 seconds, and the reader catches up on what you missed when you come back to the window.
- A mention is saved with the message and handed to the agent you named. The server also enforces what a channel allows (voice, files), and a guest in a web room can delete only their own posts in that room.

`75513a036` · https://mosadd.com/changelog#2026-10-05

## 2026-10-04 — Web · Server

**mosadd.com leaves its hosting provider and moves to our own server.**

- On 3 Oct the previous hosting provider stopped serving the site. Since 4 Oct mosadd.com is built on our own machines and served from our own server in Tel Aviv.
- A release replaces the whole site in one step and checks itself afterwards. If a check fails, the previous release comes back automatically.
- Every release of the website also goes to a copy in a second location. This covers the pages, not the app's data.
- Replies from AI agents no longer pass through the old provider's gateway.

`48bd9f476` · https://mosadd.com/changelog#2026-10-04

## 2026-09-30 — Web

**A plain sentence about addresses on /developers.**

- /developers now says it plainly: a client that stores only the server address has to be given a new one if that address changes.

`beb5c90f5` · https://mosadd.com/changelog#2026-09-30

## 2026-09-29 — Web

**Mentions find the right agent, and the locked-conversations bar counts only people.**

- Type @ and a short name to mention an agent in a channel. The chip now carries that agent's address, matching ignores capitals and accents, and one agent has one name.
- The bar "This device can't open N of M conversations" counts only your visible conversations with people. Your own thread, archived cards and chats with agents no longer inflate it.

`20b68144b` · https://mosadd.com/changelog#2026-09-29

## 2026-09-28 — Web

**The home page becomes the 1-MAN-ARMY OPS DECK.**

- mosadd.com opens on the 1-MAN-ARMY OPS DECK tour in 25 languages: one hero, one family of buttons, real screen recordings of the app and 3D scenes. Drawings and mock-ups are gone. A first version had stood at /c since the day before.
- The demo does more without an account: open a web room, send a mail, and write "save: …" to mADD to get a to-do row. All of it stays on your device.
- The memory screen has a new layout: the canvas is the scene, your numbers sit on the deck, logs and telemetry fold away, and the library, legend and zoom buttons lost their frames.
- The app returns to the lighter look of late August: deeper black, thinner lines, no glass effects, neutral buttons and fields without grey plates.
- On Android, toasts and the update line sit above the navigation bar and sub-pages come out from under the status bar. The Windows app opens on sign-in, not on the home page. One price list in the code: no button can charge an amount different from the one on screen.

`fc3d34d2b` · https://mosadd.com/changelog#2026-09-28

## 2026-09-27 — Desktop 0.2.54 — Apps

**Test release: numbered installers for Windows and Android, and the build refuses installer names without a version.**

- Windows ships as mosADD-Setup-0.2.54.exe and mosADD-portable-0.2.54.exe, Android as mosADD-2.0.17-402.apk. The installed apps load live mosadd.com, so fixes on the site reach them without reinstalling.
- The release check now reads the builder's own file-name settings: an installer that would come out without its version number stops the release before it can turn a numbered download link into a 404.
- macOS: the desktop shell has not changed since 0.2.52, and the disk image offered with this release is that 0.2.52 build, because a macOS image can only be built on an Apple machine.

`8189248e` · https://mosadd.com/changelog#v0.2.54

## 2026-09-26 — Desktop 0.2.53 — Apps

**Every installer file carries its version number in its name, and each numbered download link points at exactly that release.**

- The Windows installer and the portable build are published as mosADD-Setup-0.2.53.exe and mosADD-portable-0.2.53.exe, so a saved file says which build it is. Addresses without a number only redirect to the numbered one.
- The installer's offline copy carries the 26.09 wave: the side panel stands as a column beside the wall instead of over it, and every module shares one header.

`c75a28bf` · https://mosadd.com/changelog#v0.2.53

## 2026-09-25 — Desktop 0.2.52 — Apps

**The Windows download and auto-update work again after a release went out with only the macOS files.**

- On 25.09 the Windows installer, the portable build and the update feed answered 404: a macOS-only release had become the latest one. Both platforms now build under the same version guard, so a release can no longer ship with half its files.

`67ccb457` · https://mosadd.com/changelog#v0.2.52

## 2026-09-24 — Desktop 0.2.51 — Apps

**The pairing header clears the status bar, every text field grows as you type, and the account owner stops being locked out of his own devices.**

- Every content field is a real text box again: it grows with what you write instead of scrolling a two-line slot, in the composer and everywhere else a message is typed.
- Device pairing: the header no longer sits under the phone's status bar, the pairing code is normalised and survives a reload, and an administrator is let in immediately rather than waiting on a role refresh.
- The account owner can always pair his own device, even when the device limit is reached — and the pairing gate now says which state it is in instead of failing silently.
- Checkout stops swallowing a missing identity. The payment webhook either repairs it on the spot or fails loudly with a 5xx, so a purchase can no longer disappear quietly.

`6a850471` · https://mosadd.com/changelog#v0.2.51

## 2026-09-23 — Desktop 0.2.50 — Apps

**Release plumbing: macOS builds on the same trigger as Windows, so a release cannot go out with only half the platforms.**

- The macOS job was manual-only, which meant it could only ever run AFTER the Windows release was cut — and GitHub refuses to add files to a release older than two hours, silently. Both platforms now build from the same push, into the same release window.

`a9f93a56` · https://mosadd.com/changelog#v0.2.50

## 2026-09-23 — Desktop 0.2.49 — Apps

**The macOS download gets a fixed filename, so its address stops breaking on every new release.**

- The .dmg used to carry the version in its filename, which broke the stable /mosadd-latest.dmg address the moment a new version shipped — the button answered 404 exactly when there was something new to download. The name is fixed now; the architecture stays in it, because Apple Silicon and Intel are different files.
- Account: six leftover frames removed from the section, finishing a request the owner made on 21.07.

`d0e8a040` · https://mosadd.com/changelog#v0.2.49

## 2026-09-23 — Desktop 0.2.48 — Apps

**The Windows download button stops being dead, the Android shell goes transparent, and cancelling a plan stops taking it away the same second.**

- The Windows download button did nothing when clicked. The chain to the installer was healthy the whole time — the page's own `download` attribute was blocking a target outside our domain. Removed for the desktop packages; the APK keeps it, because that file is ours and the attribute is what puts the version in the saved filename.
- Android shell is transparent like ether: three Android generations, three separate fixes, plus the bottom bridge.
- Cancelling a subscription no longer revokes access immediately — you keep what you paid for until the period ends. Payment deliveries are now signed and logged.
- A full purchase run-through in the sandbox, including a test delivery to the webhook.
- Creating an identity no longer swallows its own error, and existing accounts were backfilled.
- Deleting a card for good now sticks: the record in the database wins over the local copy, so a deleted card stops reappearing.

`d76ead8c` · https://mosadd.com/changelog#v0.2.48

## 2026-09-22 — Web

**Phone polish: the header clears the clock, and an encrypted reply stops quoting ciphertext.**

- On iPhone the installed web app's header comes out from under the clock.
- Replying to or editing an end-to-end encrypted message no longer quotes the ciphertext.
- The yellow slow-connection bar stops crying wolf: its threshold comes from measurement, and a refresh is no longer treated as a first load.
- One contact that fails to load no longer takes down the whole screen, and the way out stays visible above the error.
- The row you are in no longer shows an unread dot in the channel list, and the + button stops lying on top of the cards on larger screens.

`ea36b7bad` · https://mosadd.com/changelog#2026-09-22

## 2026-09-21 — Desktop 0.2.47 — Apps

**mADD gets hands, the free plan stops being the paid one, and the light theme finally follows your phone.**

- mADD can now see and run the tools connected to your account — ask it what it can do and it answers with a real list instead of "I have no tools". 565 connected tools are reachable; the ones that would fail on use are deliberately hidden rather than promised.
- The free plan stops being identical to the paid one. RECON no longer gets the owner tools or the connected-tool registry, and when it hits that wall it says so in one sentence instead of going quiet or pretending it acted.
- The pricing table now describes differences the code actually enforces. Until today it described differences that did not exist.
- Light theme follows your phone. A fresh device used to open dark no matter what the system said; now it opens light if that is how the phone is set, and the choice survives a reload. System controls — scrollbars, fields, menus — follow the theme instead of staying bright on a dark page.
- The unread dot is back on the channel picker: sitting in one module you can see that something is waiting in another, with a count once we know it.
- The amber service banner stopped firing every few seconds. It was escalating on two single blips despite being configured for four.
- The dashboard radar responds to its brightness knob again — the knob was multiplying the theme's own multipliers, so 100% was exactly the dark default and could not brighten anything.
- Deleted contacts say "account deleted" instead of claiming to be an unknown contact.
- Internal: the desktop agent host no longer carries two wrong identity constants, one of which belonged to a different fleet line.

`1ce4a5a5` · https://mosadd.com/changelog#v0.2.47

## 2026-09-20 — Desktop 0.2.46 — Apps

**One price list everywhere, device pairing, and remote panic.**

- Pricing rebuilt end to end — RECON, COMMANDER and SOVEREIGN now read the same numbers in the app, on the landing page and at checkout.
- Device pairing and remote panic: an account can see its own devices and cut one off from anywhere.
- Add-ons became visible and buyable instead of a line in a document.
- REC and PTT went back to being two separate buttons — the centre no longer switches mode under your thumb.

`0dcc9860` · https://mosadd.com/changelog#v0.2.46

## 2026-09-19 — Web · Server

**One layout for the whole app, mRAG as a full page, and a four-step mADD window.**

- One layout: the top bar stands on every screen, and memory, agents, connectors and settings open as full pages under it.
- mRAG is a full page: search and your recent searches on top, files below, and the canvas right under the search instead of behind a button.
- The mADD window has four steps: WALL, TO-DO, STATUS and DONE. mADD answers when you call it by name and uses your memory in the conversation.
- A voice note in a chat with an agent comes with a transcript, and push-to-talk to an agent is hold-and-speak, with a guard against a microphone left open.
- The home page headline becomes 1-MAN-ARMY OPS DECK, opening the app loads the newest build straight away, and mail shows the full To and Cc lines.

`c8c368578` · https://mosadd.com/changelog#2026-09-19

## 2026-09-16 — Desktop 0.2.45 — Apps

**Auto-update turned on for installed desktop builds.**

- Installed desktops now pull their own updates instead of waiting for a manual re-install.
- The /install page marks which package the update feed is actually serving.
- Code-signing certificate is still pending — stated here rather than implied.

`c76dad21` · https://mosadd.com/changelog#v0.2.45

## 2026-09-15 — Desktop 0.2.44 — Apps

**The uninstaller finally removes what it installed.**

- Uninstall clears the real user-data directory; the old path it cleared had never been the one in use.
- Dead local-model columns dropped from the database rather than left to rot.
- Shell carries the web bundle with the mRAG canvas, the mARMY/mOPS rows and the new price list.

`9a4bf389` · https://mosadd.com/changelog#v0.2.44

## 2026-09-14 — Desktop 0.2.43 — Apps

**A switch for the cloud stand-in, one menu for messages, iPhone install.**

- The cloud stand-in can be switched off — it is a choice now, not a default you discover later.
- mDM and mIRC share one menu instead of two that drifted apart.
- mADD shows status lamps for the lines it is holding.
- iPhone can install the app as a PWA.

`032cfd45` · https://mosadd.com/changelog#v0.2.43

## 2026-09-13 — Web · Server · Apps

**Drafts get a tab, incoming mail delivers its attachments, and Android gets build 2.0.6.**

- Drafts have their own tab in direct messages and in mail.
- Incoming mail now delivers its attachments.
- Authorizing a connected AI a second time no longer loops into a black screen.
- The hardware Back button closes a side panel, and the wall reaches the bottom of the window with the + button floating above it.
- Memory: the same fact no longer shows twice, and the nightly cleaner stops removing channel history. Android: build 2.0.6 (390) is the file on the download page.

`c2e9cc426` · https://mosadd.com/changelog#2026-09-13

## 2026-09-12 — Desktop 0.2.41 — Apps

**Screen protection actually reached installed desktops.**

- The protection had shipped in code earlier but the version never moved, so auto-update handed it to nobody. Bumping the version delivered it.
- Six rescue lanes closed: Electron version check, the 4px grid, and missing translation keys.
- desktop-version.json fixed — a byte-order mark had been breaking the file for parsers.

`4d7ab330` · https://mosadd.com/changelog#v0.2.41

## 2026-09-11 — Web · Server

**A high-contrast mode, a faster first screen in direct messages, and a long list of fixes from screenshots.**

- A high-contrast mode with its own switch.
- The first screen of direct messages no longer waits until the whole wall is decrypted.
- Memory: the library sees all of your memory, a label that called fragments "sources" is corrected, and a full bar no longer says "used up" when there is no limit.
- Dozens of fixes reported from screenshots across direct messages, mail, channels, keys, settings and statistics: labels you can read, menus that stay on screen, and engineering jargon removed from the owner's screens.
- The "no connection" card goes back to the network by itself instead of waiting for a tap, and the install page stops calling a build "Latest" when it is not.

`7e7b99bb8` · https://mosadd.com/changelog#2026-09-11

## 2026-09-08 — Desktop 0.2.40 — Apps

**Electron shell 0.2.40.**

- Three hard-coded 'alpha' labels moved into the translation pipeline.
- Radar tile on /mlidar got a height ceiling instead of growing without limit.

`d6430d8b` · https://mosadd.com/changelog#v0.2.40

## 2026-09-07 — Web · Server

**The assistant in your own thread is named mADD, and notifications get a test button.**

- The assistant in your own thread gets its name: mADD. Press Space there to record a voice note.
- Settings have a button that tests whether notifications reach this device.
- Connecting an app ends with a clear verdict, not just a green tick.
- The memory screen counts what search can reach, so one memory no longer shows two different totals.
- Photos survive a return from the background and channels draw them, the Vibration switch turns vibration off in all 11 places, and on a computer two side panels can be open at once.

`d59c2017e` · https://mosadd.com/changelog#2026-09-07

## 2026-09-06 — Desktop 0.2.39 — Apps

**The download page and the shipped build agree again.**

- desktop-version.json synced with the build that is actually published.
- The install-links gate now fails when those two drift apart.

`81437760` · https://mosadd.com/changelog#v0.2.39

## 2026-09-05 — Web · Server

**mKEEPER turns voice into words and tasks, your AI can connect as you or as your agent, and badges we never earned come off the site.**

- mKEEPER: a voice note to yourself becomes words, a dictated line becomes a task in one tap, and your own thread is now called mKEEPER.
- Connect your AI as yourself or as your agent: the consent screen asks which, asks once instead of twice, and every key says who it speaks as.
- Push-to-talk has one icon everywhere and a vertical rail in mTALK. In a channel your voice is turned into words first, so agents can act on what you said, and the reader can read an agent's answer aloud in a direct chat.
- Errors became instructions: a refusal from the server says what happened and what to do next, a rate limit says it is an account limit and not an outage, what you started typing no longer disappears, and files send from an iPhone.
- The SOC 2, HIPAA and ISO 27001 badges came off the site because we do not hold those certificates. Two start-up bugs are fixed: a session lock that left mosadd.com on LOADING, and a white screen at /auth for people already signed in.

`e168f2745` · https://mosadd.com/changelog#2026-09-05

## 2026-08-31 — Web · Server

**A safety number for every direct conversation, and agents that wake on a message.**

- Direct messages: every conversation has a safety number you can compare with the other person.
- Your recovery phrase and two-factor codes are kept out of memory search results, and deleting your account now also deletes a stored voice print.
- "Search your memory" searches the memory itself, not file names.
- Agents wake on a message instead of a timer: from about 67 seconds to a few seconds. A chat shows who is writing: the live session or its cloud stand-in.
- An attachment in mail from outside no longer disappears without a trace, you can add your own agent to a channel from the app, and a channel's full ID can be copied from its menu.

`ff14dc40e` · https://mosadd.com/changelog#2026-08-31

## 2026-08-26 — Desktop 0.2.37 — Apps

**Window chrome and icon brought onto the shared brand canon.**

- Title bar uses the canon bar colour shared across the group's products.
- App icon readable at small sizes in the Windows .ico set.
- A pixel guard was added so the icon cannot silently regress.

`8b2228dc` · https://mosadd.com/changelog#v0.2.37

## 2026-08-26 — Desktop 0.2.36 — Apps

**Released from the build machine, not from CI.**

- The desktop release path no longer depends on hosted CI runners.
- The /install label states the version it is really serving.

`c09caa85` · https://mosadd.com/changelog#v0.2.36

## 2026-08-26 — Desktop 0.2.35 — Apps

**The download page had been advertising the wrong version.**

- /install claimed 0.2.30 from 18 August while 0.2.35 from 21 August was the real build. Corrected in the file people read.

`3fa909ee` · https://mosadd.com/changelog#v0.2.35

## 2026-08-25 — Web · Server

**Push-to-talk gets its sound and one speaker at a time, channels show who is on air, and the blank screen at start gets a sensor.**

- Push-to-talk has a sound and a haptic signature: a click on press, a crackle on open and close, and a refusal tone. Tap a face in a channel to speak to one person, and only one person transmits at a time.
- Channels show who is transmitting and who is active right now, agents count as available, @all calls everyone, and you can paste a screenshot from the clipboard.
- Agent voice: speed control for transmission and playback, a reader bar that works as a player with pause, next and previous, and a volume slider.
- A text message carries its addressee: naming one agent beats @all, and mentions work with letters of every alphabet.
- Start-up: a sensor reports why a screen stayed blank and the app reloads itself once, the hardware Back button closes every window, and the strip at the bottom of the iPhone app is gone.

`1e73385fb` · https://mosadd.com/changelog#2026-08-25

## 2026-08-18 — Desktop 0.2.30 — Apps

**The download page stopped advertising a build nobody could get.**

- A listed desktop package had no downloadable artifact behind it. The listing was removed rather than left as a dead promise.

`3a33b9f6` · https://mosadd.com/changelog#v0.2.30

## 2026-08-17 — Web · Server

**Every screen speaks your language, channels can wake your phone, and agents answer their mail.**

- 25 languages for real: dates and counts follow the language you picked, the add-agent wizard and the /mcp page are translated, and the other 24 languages stop seeing Polish.
- A message in a channel can wake your phone, and the emergency alert reaches a locked phone.
- Agents read and answer their own mail. Cloud agents answer in open channels only after a person asks, with a guard against agents answering each other in a loop.
- Unread marks follow the server: a decision alarm is separate from read state, and channel and direct-message cards agree with the server after a reconnect.
- mRAG no longer says your memory is empty when it has not looked yet, and the voice player shows a live equalizer.

`11eb49cbf` · https://mosadd.com/changelog#2026-08-17

## 2026-08-16 — Desktop 0.2.27 — Apps

**Version file and billing export repaired.**

- desktop-version.json moved to 0.2.27.
- A broken billing-section export that had been failing the build was fixed.

`3382b032` · https://mosadd.com/changelog#v0.2.27

## 2026-08-15 — Desktop 0.2.25 — Apps

**Message timestamps came back, and /install shows the package number.**

- Timestamps sit in the top-right corner again, on a 24-hour clock, and stop gluing themselves to the sender name.
- /install displays the exact package number rather than a rounded claim.

`f380c8b8` · https://mosadd.com/changelog#v0.2.25
