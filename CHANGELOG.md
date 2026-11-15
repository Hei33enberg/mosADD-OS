# mosADD changelog

Every mosADD release that reached production, newest first: the website and web app (**Web**), the server (**Server**) and the apps you install — Windows, Android, macOS, PWA (**Apps**).

Live page: https://mosadd.com/changelog · JSON: https://mosadd.com/changelog.json

<!-- Generated from apps/web/src/data/changelog.ts by scripts/changelog-lustra.mjs. Do not edit by hand. -->

## 2026-11-15 — Web · Server · Apps

**One screen to start, mosADD installable everywhere, mKEEPER for your own notes and voice, calls that ring through — and a leaner, truer site with a changelog that covers every release.**

- The home page fits one screen on a phone and on a computer: a live animation of people, agents and robots talking through mDM, mIRC, mAYL, PTT and Telegram into mRAG, Join mosADD and See Demo, and a one-line developer start with `npx @mosadd/mcp`. Every page now shares the new logo, header and menu, and the developer quickstart gives commands that work: connect at mcp.mosadd.com/mcp with a browser sign-in, or use a key from mosadd.com/keys as MOSADD_API_KEY.
- Getting in: install mosADD from the website as an app on iPhone, Android and computers — one big button for the device you are on — with notifications reaching the browser and the installed app again, and macOS has a download again (two zips, Apple Silicon and Intel). The new /recruit page, opened from the menu, shows how to bring people in with a 20-second voice note and your mosADD link over WhatsApp, Telegram, SMS, mail or DM — free for humans.
- Your own stream is now mKEEPER: notes, files, GIFs and voice in one place, saved to your mRAG memory, Write @mADD to ask your assistant — it can also tell you which of your agents have gone quiet; anything else stays a note. Voice: a call started by an agent rings the other side, phones wake up for calls and PTT, a named PTT room stays with its owner, and a voice note arrives with its transcript and the recording.
- Chats with agents work like Telegram: type / in a conversation or channel with an agent and the commands it announces come first — /new starts a fresh session, /status, /stop, /model, /help — and Enter sends the command straight to the agent, with your connected apps' actions listed below. Press and hold any message in mDM, mIRC or mTALK for one short, consistent menu, and channel menus show only what works.
- A leaner, truer site: mLIDAR and Voice Truthgate are paused for the first release (add-ons already bought stay in billing), the extension, mURL and AfterStream pages are hidden for now, every old demo link opens the one live demo, and the privacy pages say plainly that end-to-end encryption covers 1:1 conversations between people, while channels with an AI agent, files and mail are readable by our server.

`7c7e4b9c4` · https://mosadd.com/changelog#2026-11-15

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

## 2026-09-12 — Desktop 0.2.41 — Apps

**Screen protection actually reached installed desktops.**

- The protection had shipped in code earlier but the version never moved, so auto-update handed it to nobody. Bumping the version delivered it.
- Six rescue lanes closed: Electron version check, the 4px grid, and missing translation keys.
- desktop-version.json fixed — a byte-order mark had been breaking the file for parsers.

`4d7ab330` · https://mosadd.com/changelog#v0.2.41

## 2026-09-08 — Desktop 0.2.40 — Apps

**Electron shell 0.2.40.**

- Three hard-coded 'alpha' labels moved into the translation pipeline.
- Radar tile on /mlidar got a height ceiling instead of growing without limit.

`d6430d8b` · https://mosadd.com/changelog#v0.2.40

## 2026-09-06 — Desktop 0.2.39 — Apps

**The download page and the shipped build agree again.**

- desktop-version.json synced with the build that is actually published.
- The install-links gate now fails when those two drift apart.

`81437760` · https://mosadd.com/changelog#v0.2.39

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

## 2026-08-18 — Desktop 0.2.30 — Apps

**The download page stopped advertising a build nobody could get.**

- A listed desktop package had no downloadable artifact behind it. The listing was removed rather than left as a dead promise.

`3a33b9f6` · https://mosadd.com/changelog#v0.2.30

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
