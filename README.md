<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# 🐶 Ma Dog Ate Ma Homework

## Basic Details

### Team Name: La Peace

### Team Members

* **Team Lead:** Sebin Lalu - S3 CSEB
* **Member 2:** Ramshankar R - S3 CSEB

---

## Project Description

**Ma Dog Ate Ma Homework** is a completely unnecessary browser extension featuring a tiny pixelated dog that demands to be fed every 30 seconds.

Ignore the dog for too long and it gets hungry, runs around your screen, and starts eating random chunks of text you've already typed. Feed it a treat in time, and it peacefully goes back to sleep.

---

## The Problem (that doesn't exist)

People are able to use their browsers peacefully without having to worry about the nutritional requirements of a tiny pixelated dog.

This is clearly unacceptable.

There is currently no system forcing users to stop whatever they're doing every 30 seconds to feed a digital dog.

**We decided to solve this extremely serious problem.**

---

## The Solution (that nobody asked for)

We created at puts a small pixelated dog and its bowl of treats at the bottom of your browser.

The dog follows a simple cycle:

**Sleep → Wake Up → Demand Food → Eat Your Text → Return → Sleep**

Every 30 seconds, the dog wakes up and looks at the user.

The user then has **10 seconds** to feed it by dragging a treat from the bowl to the dog.

If the dog is fed:

**Treat → Munch Munch → Sleep**

If the dog is ignored:

**Angry Dog → Run Around → Eat Text → Return Home → Sleep**

It doesn't matter whether the text is an assignment, an important message, a paragraph you've spent 20 minutes writing, or something completely useless.

**The dog eats it anyway.**

---

# 🐕 How It Works

### 1. 💤 Dog Sleeps

The dog starts in a sleeping animation at the bottom of the browser.

The treat bowl sits nearby.

While sleeping, the dog is harmless and does absolutely nothing useful.

A 30-second timer runs in the background.

---

### 2. 👀 Dog Wakes Up

After 30 seconds, the dog wakes up.

It lifts its head and looks toward the user.

This begins the **10-second feeding window**.

The message is simple:

> **Feed me.**

---

### 3. 🦴 Drag the Treat

The user clicks on the treat bowl.

A small pixelated treat attaches to the cursor.

The user can then drag the treat across the browser window.

---

### 4. 😋 Feed the Dog

If the user moves the treat over the dog and releases the mouse button:

* The dog detects the treat.
* A munching animation plays.
* The feeding cycle resets.
* The dog returns to its sleeping animation.
* The 30-second timer starts again.

The crisis has been successfully avoided.

---

### 5. 🏃 The Dog Gets Hungry

If the dog isn't fed within 10 seconds, it stops waiting.

It gets up and starts running randomly around the browser.

While running, the dog searches for text that the user has already entered.

When it reaches a suitable text target:

**CHOMP.**

A random chunk of the text gets deleted.

The dog continues running and eating until its hunger episode is over.

Then it returns to its original position and goes back to sleep.

---

# 🧠 Text Detection & Eating

The extension uses JavaScript and browser DOM interaction to identify editable areas of the current webpage.

The dog can look for user-entered content in places such as:

* Text input fields
* Textareas
* Editable elements
* Supported web-based editors

When the dog enters its **hungry/running state**, it identifies suitable text targets and moves toward them.

Once the dog reaches a target, a randomly selisting text is removed.

The amount of text eaten is intentionally random.

Because if the dog is going to destroy your work, it shouldn't be predictable.

---

# 🎨 Pixel Art & Animations

The entire extension uses custom pixel-art assl like a tiny creature living inside the browser.

## Animations

### 💤 1. Sleeping

The dog's default state.

It lies down and sleeps while waiting for its next feeding cycle.

---

### 👀 2. Waking Up

The dog lifts its head, wakes up and looks toward the user.

This signals that it is ready to be fed.

---

### 🏃 3. Running & Munching

When the dog isn't fed, it starts running across the screen.

The animation includes mouth movement to make it look like the dog is constantly searching for something to eat.

Unfortunately, that something is your text.

---

### 😋 4. Sitting & Munching

When successfully fed, the dog sits upright and performs a short munching animation.

This confirms that the treat has been successfully delivered.

---

### 💤 5. Going Back to Sleep

After eating, the dog returns to its original position and goes back to sleep.

The 30-second hunger timer then starts again.

---

# 🖼️ Static Assets

### 🥣 Treat Bowl

A static pixel-art bowl containing the dog's treats.

It remains positioned near the bottom-left of the browser.

---

### 🟤 Dog Treat

A small brown pixel-art object representing the dog's food.

When the user clicks and drags from the treat bowl, the treat follows the cursor until it is delivered to the dog.

---

# 🛠️ Technical Details

## Technologies / Components Used

### For Software

* **JavaScript** — Core behaviour, timers, state management, mouse interactions and text manipulation
* **HTML** — Extension structure and UI elements
* **CSS** — Positioning, styling and animations
* **Browser Extension APIs** — Interaction with webpages
* **DOM APIs** — Detecting and interacting with editable webpage content
* **Claude** — Browser-extension architecture and development assistance
* **Antigravity** — Development and implementation assistance
* **Claude, ChatGPT & EZGIF** — Pixel-art creation, animation preparation and asset processing
* **Git & GitHub** — Version control and collaboration

### For Hardware

**None.**

No hardware was harmed during the development of this project.

---

# ⚙️ Implementation

## Software Architecture

The extension is built around a simple **state machine** controlling the dog's behaviour.

```text
                    ┌──────────────┐
                    │    SLEEP     │
                    └──────┬───────┘
                           │
                     30 seconds
                           │
                           ▼
                    ┌──────────────┐
                    │     WAKE     │
                    └──────┬───────┘
                           │
                     10 second window
                           │
                  ┌────────┴────────┐
                  │                 │
                FED             NOT FED
                  │                 │
                  ▼                 ▼
           ┌────────────┐    ┌──────────────┐
           │   MUNCH    │    │    RUNNING   │
           └─────┬──────┘    └──────┬───────┘
                 │                  │
                 │             Find Text
                 │                  │
                 │                  ▼
                 │           ┌──────────────┐
                 │           │  EAT TEXT    │
                 │           └──────┬───────┘
                 │                  │
                 │             Return Home
                 │                  │
                 └─────────┬────────┘
                           ▼
                    ┌──────────────┐
                    │    SLEEP     │
                    └──────────────┘
```

---

# 📦 Installation

Clone the repository:

```bash
git clone https://github.com/seb-iin/useless_project_temp.git
```

Move into the project directory:

```bash
cd useless_project_temp
```

No additional hardware or external setup is required.

---

# 🚀 Run

### Firefox

1. Open Firefox.
2. Go to:

```text
about:debugging
```

3. Select **This Firefox**.
4. Select **Load Temporary Add-on**.
5. Select the extension's manifest file.
6. Open a webpage containing editable text.
7. Wait for the dog.

---

# 📸 Project Documentation

## Screenshots

### Screenshot 1 — The Sleeping Dog

<img width="113" height="113" alt="Screenshot 2026-09-04 070258" src="https://github.com/user-attachments/assets/f2577435-07d9-4c56-907f-8a5b791dc060" />


*The dog peacefully sleeping at the bottom of the browser with its treat bowl nearby.*

---

### Screenshot 2 — Feeding Time

<img width="111" height="143" alt="Screenshot 2026-09-04 070324" src="https://github.com/user-attachments/assets/be02f328-c18b-48b4-b16d-d4d26bd97981" />


*The user drags a treat from the bowl toward the hungry dog.*

---

### Screenshot 3 — Ma Dog Ate Ma Homework
<img width="157" height="147" alt="Screenshot 2026-09-04 070330" src="https://github.com/user-attachments/assets/ba48820a-a592-4ea2-8631-c44dd23f1d2b" />


*The dog has entered its hungry state and is running around the browser looking for text to eat.*

---

# 📊 Workflow

![Workflow](Add workflow diagram here)

*Workflow showing the complete dog behaviour cycle from sleeping and waking to either being fed or eating the user's text.*

---

# 🎥 Project Demo

## Video

[Add your demo video link here]

*The demo demonstrates the complete interaction cycle: the dog sleeping, waking up, being fed, returning to sleep, and the alternative behaviour where the dog becomes hungry and starts eating text.*

---

# 🔗 Additional Demos

* (Add link here)
* [Project Presentation](Add link here)
* [Additional Documentation](Add link here)

---

# 👥 Team Contributions

### Sebin Lalu

* Browser extension architecture and overall project implementation
* Dog behaviour and state-machine logic
* Feeding interaction and treat dragging
* Timer and animation control
* Integration and testing

### Ramshankar R

* Text detection and webpage DOM interaction
* Text-eating mechanism
* Dog movement and interaction with webpage elements
* Testing and debugging
* Integration of project components

### Pixel Art & Assets

* **Claude**
* **ChatGPT**
* **EZGIF**

Used for designing, refining, animating and processing the pixel-art dog, treats and other visual assets.

---

# 🧪 Testing

| Test Case                    | Expected Behaviour              |
| ---------------------------- | ------------------------------- |
| Extension starts             | Dog appears sleeping            |
| 30 seconds pass              | Dog wakes up                    |
| Treat is dragged toward dog  | Treat follows cursor            |
| Treat reaches dog            | Dog accepts treat               |
| Dog is fed                   | Munching animation plays        |
| Dog is successfully fed      | Dog returns to sleep            |
| Dog isn't fed for 10 seconds | Dog starts running              |
| Dog reaches editable text    | Text-eating behaviour activates |
| Text is eaten                | Random chunk of text is removed |
| Hunger episode ends          | Dog returns home                |
| Dog returns home             | Dog goes back to sleep          |
| New timer starts             | Cycle repeats                   |

---

# 🐛 Known Limitations

* Text interaction depends on how individual websites implement their text editors.
* Some complex web applications may not expose editable content in a way the extension can easily manipulate.
* The dog currently works best with standard inputs, textareas and supported editable elements.
* The dog's understanding of "important text" is currently **non-existent**.
* The dog does not recognize deadlines.
* The dog does not accept excuses.

---

# 🔮 Future Improvements

If we somehow decide that this project isn't useless enough yet:

* 🐕 Multiple dog personalities
* 🍖 Different types of treats
* 🏠 A customizable dog house
* 😡 Different hunger levels
* 🏃 More running animations
* 🎵 Dog sound effects
* 💬 Random dog dialogue
* 📊 "Words Eaten Today" counter
* 🏆 Leaderboard for most destroyed text
* 🐶 Multiple dogs competing for food
* 🎨 Custom pixel-art themes
* ⚙️ Customizable hunger timers
* 🌐 Better support for complex web editors
* 🦴 Different consequences for starving the dog

---

# 🤔 Why Does This Exist?

We asked ourselves:

> **"What if a browser extension could make using a browser objectively more annoying?"**

And thus, **Ma Dog Ate Ma Homework** was born.

Thousands of browser extensions exist to improve productivity.

Ours exists to make sure you **feed a pixelated dog every 30 seconds or lose your work.**

Is it useful?

**No.**

Does it need to exist?

**Absolutely not.**

Does the dog care?

**No. The dog is hungry.**

---

# ❤️ Acknowledgements

This project was created as part of **TinkerHub Useless Projects 3.0**.

Built using:

* Questionable decisions
* Pixel art
* JavaScript
* Browser APIs
* Claude
* ChatGPT
* Antigravity
* EZGIF
* GitHub
* And one extremely hungry dog

---

Made with ❤️ and 🐶 at **TinkerHub Useless Projects**
