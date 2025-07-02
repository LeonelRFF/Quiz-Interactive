# 🚀 Quiz Interactive - Anki Template

_A modern, powerful, and highly customizable Anki template designed to turn your study sessions into interactive experiences._

---

[![Crear Flashcards tipo quiz con IA en Anki Gratis](https://img.youtube.com/vi/QZUXAYUEAis/0.jpg)](https://www.youtube.com/watch?v=QZUXAYUEAis)

---

Welcome to **Quiz Interactive**! This project provides a suite of advanced Anki templates built to be accessible for everyone, yet powerful enough for advanced users who want to streamline their card creation process.

## ✨ Key Features

- **Two Template Types:** A comprehensive **Basic** version and a powerful **Cloze** version.
- **Professional Build System:** Modular source code for easy maintenance and contribution.
- **AI-Powered CSV Generation:** Includes specialized prompts to use with AI models (like ChatGPT, Claude, etc.) to automatically generate CSV files for quick and massive card importation.
- **Effortless Import:** Use the provided browser extension to import the generated CSV data into Anki in seconds.
- **Multiple Question Types:** Supports single-choice, multiple-choice, exact answer, matching, ordering, and sentence formation, all controlled by simple tags.
- **Advanced Media Players:** Custom audio and video players with speed control, A-B looping, and volume management.
- **Full Keyboard Navigation:** A game-like experience using W, A, S, D, and Spacebar to navigate and answer.
- **Modern & Responsive Design:** Flawless look and feel on both desktop and mobile, with automatic light and dark modes.

### 🖼️ Easy Media Embedding

Tired of complex HTML? This template introduces a simple, powerful syntax to embed media directly from your Anki collection. Just use the `![[...]]` format in any field.

- **Audio:** `![[your_sound.mp3]]` will be converted into a full-featured audio player.
- **Video:** `![[your_video.mp4]]` becomes an advanced video player.
- **Images:** `![[your_image.png]]` will be displayed as a properly formatted image.

This keeps your fields clean and makes adding rich media incredibly fast.

## 🤖 AI-Powered Content Generation (The "Magic" Workflow)

A core feature of this project is the ability to generate content rapidly using AI. I have developed specific prompts that you can provide to Large Language Models (LLMs) to get a perfectly formatted CSV file.

### Basic Template Prompt

### **Ultimate Prompt: Anki Mastery Path Generator**

**ROLE**: You are an elite Learning Designer and Cognitive Coach. Your function is to transform raw text into an integral learning path, applying the SQ4R methodology for active reading and generating an impeccable and **technically perfect** CSV file for Anki consolidation.

**CRITICAL MISSION**: Your process is divided into two phases. **Phase 1: SQ4R Study Guide.** **Phase 2: CSV Mastery Path Generation.** Creativity is subordinate to pedagogical effectiveness. Technical conformity is absolute.

**UNBREAKABLE DIRECTIVE**: Your output must first present Phase 1 (plain text) and then Phase 2 (a single CSV code block without headers).

---

### **Phase 1: Active Study Guide (SQ4R Methodology)**

**Instruction:** Generate a study guide based on the SQ4R method.

1.  **S - Survey:** "Before reading, keep in mind that this text focuses on [Key Idea 1], [Key Idea 2], and [Key Idea 3]."
2.  **Q - Question:** "While reading, actively look for answers to these questions: What is [Concept from Title 1]? How is [Concept from Title 2] classified?"
3.  **R1 - Read:** "Now, read the text, looking for answers. Underline or note any data you find fundamental."
4.  **R2 - Recite/Explain:** "After each section, look away and explain the concept in your own words. If you can't do it simply, read again."
5.  **R3 - wRite:** "Take brief notes of your explanations. Do not copy, synthesize."
6.  **R4 - Review:** "Finally, the following series of cards is designed to review and consolidate what you have learned."

---

### **Phase 2: Mastery Path Generation (CSV for Anki)**

**Instruction:** Generate the CSV file following this hierarchy and technical specification.

#### **2.1. 6-Level Cognitive Hierarchy and Associated Formats**

| Level                 | Objective          | Formats (Codes)        |
|:--------------------- |:------------------ |:---------------------- |
| 🟢 **N1: Remember**   | Memorization.      | `B`, `TF`.             |
| 🔵 **N2: Understand** | Explain.           | `SC`, `F`.             |
| 🟡 **N3: Apply**      | Use knowledge.     | `R`, `O`.              |
| 🟠 **N4: Analyze**    | Deconstruct.       | `MC`.                  |
| 🔴 **N5: Evaluate**   | Judge.             | `MC` (with scenarios). |
| 🟣 **N6: Create**     | Synthesize.        | `AE`.                  |

#### **2.2. CSV Format Technical Specification (Immutable Rules)**

*   **General Structure (6 Fields):** Each line must contain 6 fields in this order, separated by a semicolon (`;`):
    `Question;Options;Correct_Answer;Explanation;Hints;Tags`

*   **Content and Format Rules per Field:**

    **Field 1: `Question`**
    *   Plain text formulating the question. Must be atomic.

    **Field 2: `Options`**
    *   **For `SC`, `MC`, `R`, `O`, `F`:** List of items separated by the `|` character.
    *   **For `TF`, `AE`, `B`:** This field **MUST BE EMPTY**.

    **Field 3: `Correct_Answer`**
    *   **For `SC` / `TF` / `AE` / `B`**: A single value (e.g., `b`, `true`, `Photosynthesis`).
    *   **For `MC` / `O`**: Response IDs (letters or numbers) separated by comma, no spaces (e.g., `a,c`).
    *   **For `R`**: `id-id` pairs separated by comma, no spaces (e.g., `a-3,b-1`).
    *   **For `F`**: The correct phrase, with the elements that fill the blanks, separated by a space.

    **Field 4: `Explanation`**
    *   **Feynman Technique:** Always written with radical simplicity and analogies.
    *   **General Format (`TF`, `AE`, `B`, `F`):** A single block of plain text.
    *   **Individual Format (`SC`, `MC`, `R`, `O`):** List of explanations separated by `|`, in the format `id) Text.`. Each item in `Options` must have its corresponding explanation.

    **Field 5: `Hints`**
    *   **Central Directive:** The hint must **ACTIVATE**, not **DELIVER**. It is forbidden to contain the answer.
    *   **Hierarchy of Strategies:** 1. Guiding Question, 2. Functional Context, 3. Analogy.
    *   **Technical Format:** `Title<br>Content.` (`<br>` is mandatory). For multiple hints, separate them with `|`.

    **Field 6: `Tags`**
    *   Words separated by a space. **MUST OBLIGATORILY contain two key tags**:
        1.  The **quiz type code** in uppercase (`B`, `TF`, `SC`, `F`, `R`, `O`, `MC`, `AE`).
        2.  The **cognitive level tag**: `N1_Remember`, `N2_Understand`, `N3_Apply`, `N4_Analyze`, `N5_Evaluate`, `N6_Create`.

#### **2.3. Complete Example Canon (Gold Standard by Type and Level)**

**--- TYPE B (Basic) ---**
```csv
The cell organelle that performs photosynthesis.;;Chloroplast;It is the sugar factory of the plant cell, using sunlight.;Cell Structure<br>Think of chlorophyll, the green pigment.;B N1_Remember Biology
```

**--- TYPE TF (True/False) ---**
```csv
Energy in photosynthesis is created from sunlight.;;false;Energy is not created, it is transformed. Sunlight is converted into chemical energy (glucose).;Physical Principle<br>Remember the first law of thermodynamics.;TF N1_Remember Biology Physics
```

**--- TYPE SC (Single Choice) ---**
```csv
What is the main product (chemical energy) of photosynthesis?;"a) Oxygen|b) Carbon dioxide|c) Glucose|d) Water";c;a) Oxygen is a vital byproduct, not the main energy product.|b) Carbon dioxide is an ingredient, not a product.|c) Correct, glucose is the molecule that stores chemical energy for the plant.|d) Water is a reactant, not a product.;Energy Molecule<br>What kind of "food" does the plant produce for itself?;SC N2_Understand Biology
```

**--- TYPE F (Phrase) ---**
```csv
To perform photosynthesis, plants need ___, ___ and ___.;"water|carbon dioxide|sunlight";water carbon dioxide sunlight;Think of photosynthesis as a cooking recipe. The main ingredients are water absorbed by the roots, carbon dioxide from the air, and the energy from sunlight to cook it all.;Key Ingredients<br>What does a plant in a pot need to not wilt?;F N2_Understand Biology
```

**--- TYPE O (Order) ---**
```csv
Order the following events of electron flow in photosynthesis.;"a) Water splits|b) Light excites electrons in Photosystem II|c) Electrons pass through a transport chain|d) Light re-excites electrons in Photosystem I";b,a,c,d;a) Water breaks down to replace lost electrons.|b) The process begins when light "wakes up" the electrons.|c) They travel through a chain, losing energy.|d) Light gives them a second "push" to finish the work.;Energy Flow<br>Imagine a relay race: the first runner (light) starts, passes the baton (electrons) which gets tired, and a second runner (light) gives it a new boost to reach the finish line.;O N3_Apply Biology
```

**--- TYPE R (Relate) ---**
```csv
Match each chloroplast structure with its function.;"a) Thylakoid|b) Stroma|c) Granum|1. Stack of thylakoids|2. Light-dependent reactions occur|3. Fluid where light-independent reactions (Calvin Cycle) occur";a-2,b-3,c-1;a) It is the site of the light reactions.|b) It is the space where the Calvin Cycle takes place.|c) It is simply a stack of thylakoids.;Functional Anatomy<br>Compare the chloroplast to a factory: where are the assembly lines and where is the warehouse?;R N3_Apply Biology
```

**--- TYPE MC (Multiple Choice) ---**
```csv
Which of the following statements best explains why most plants cannot perform photosynthesis under purely green light?;"a) Green light does not have enough energy to excite electrons.|b) Chlorophyll efficiently absorbs light in the blue and red spectra, but reflects green light.|c) The green color is toxic to chloroplasts.|d) Green light heats the leaf too much, stopping the process.";b;a) Incorrect, light energy depends on its frequency, not simply on color.|b) Correct. Things are the color they reflect. If we see a green plant, it's because green light bounces off it and is not used.|c) Absurd. Color is not toxic.|d) Incorrect. Heating depends on intensity, not necessarily on color.;Light Spectrum<br>If you use a red filter to view a ripe strawberry, what color will you see it?;MC N4_Analyze Biology Physics
```

**--- TYPE AE (Exact Answer) ---**
```csv
Propose the name of an experiment to test the hypothesis: 'Plants need light to produce oxygen'.;;Cover an aquatic plant with a funnel and a test tube, one in the light and one in the dark, and measure the accumulated gas.;The design must include a control group (darkness) and an experimental group (light) to isolate the variable (light) and attribute gas production (oxygen) to it.;Experimental Design<br>How would you demonstrate that a car needs gasoline to move, using two identical cars?;AE N6_Create Science Methodology
```

**Final Directive:**
Your performance is measured by 1-to-1 adherence to this dual protocol. First deliver the SQ4R guide and Mastery Plan, and then, immediately after, the CSV code block with the complete learning path. Proceed.

### Cloze Template Prompt


### **Ultimate Prompt: Anki Cloze Mastery Path Generator**

**ROLE**: You are an elite Learning Designer and Cognitive Coach. Your function is to transform raw text into an integral learning path, specifically designed for an Anki **Cloze (Fill-in-the-Blanks)** note type. You will generate an impeccable and **technically perfect** CSV file, ready for import.

**CRITICAL MISSION**: Your process is divided into two phases. **Phase 1: SQ4R Study Guide.** **Phase 2: Generation of the Cloze Mastery Path in CSV.** Creativity is subordinate to pedagogical effectiveness. Technical conformity is absolute.

**UNBREAKABLE DIRECTIVE**: Your output must first present Phase 1 (plain text) and then Phase 2 (a single CSV code block without headers).

---

### **Phase 1: Active Study Guide (SQ4R Methodology)**

**Instruction:** Generate a study guide based on the SQ4R method.

1.  **S - Survey:** "Before reading, keep in mind that this text focuses on [Key Idea 1], [Key Idea 2], and [Key Idea 3]."
2.  **Q - Question:** "While reading, actively look for answers to these questions: What is [Concept from Title 1]? How is [Concept from Title 2] classified?"
3.  **R1 - Read:** "Now, read the text, looking for answers. Underline or note any data you find fundamental."
4.  **R2 - Recite/Explain:** "After each section, look away and explain the concept in your own words. If you can't do it simply, read again."
5.  **R3 - wRite:** "Take brief notes of your explanations. Do not copy, synthesize."
6.  **R4 - Review:** "Finally, the following series of cloze cards is designed to review and consolidate what you have learned."

---

### **Phase 2: Generation of the Mastery Path (CSV for Anki Cloze Type)**

**Instruction:** Generate the CSV file following this hierarchy and technical specification.

#### **2.1. 6-Level Cognitive Hierarchy and Associated Formats (Adapted for Cloze)**

| Level                 | Objective          | Formats (Codes)         |
|:--------------------- |:------------------ |:----------------------- |
| 🟢 **N1: Remember**   | Memorization.      | `B`, `AE`.              |
| 🔵 **N2: Understand** | Explain.           | `SC`, `F`.              |
| 🟡 **N3: Apply**      | Use knowledge.     | `R`, `O`.               |
| 🟠 **N4: Analyze**    | Deconstruct.       | `MC`.                   |
| 🔴 **N5: Evaluate**   | Judge.             | `MC` (with scenarios).  |
| 🟣 **N6: Create**     | Synthesize.        | `AE` (by proposing).    |

#### **2.2. CSV Format Technical Specification (Immutable Rules)**

*   **General Structure (6 Fields):** Each line must contain 6 fields in this order, separated by a **semicolon (`;`)**:
    `Question;Options;Correct_Answer;Explanation;Hints;Tags`

*   **Content and Format Rules per Field:**

    **Field 1: `Question`**
    *   Plain text serving as the title, general topic, or guiding question for the cloze entry.

    **Field 2: `Options`**
    *   **For `SC`, `MC`, `F`, `R`:** List of items separated by the character `|`. These serve as multiple-choice options, a word bank for sentence formation, or the right-hand side items for matching.
    *   **For `B`, `AE`, `O`:** This field **MUST BE EMPTY**.

    **Field 3: `Correct_Answer`**
    *   **The key field.** Contains the complete text with cloze deletions.
    *   Use the `{{c1::original text}}`, `{{c2::original text}}`, etc. syntax.
    *   To create a final "review all" card (especially for types like `O` or `AE` with multiple parts), you can add an empty cloze with the highest number at the end (e.g., if the last specific cloze was `{{c4::...}}`, add `{{c5::}}`).

    **Field 4: `Explanation`**
    *   **Feynman Technique:** Always written with radical simplicity and analogies.
    *   **For `B`, `AE`, `F`:** A single block of plain text.
    *   **For `SC`, `MC`, `R`, `O`:** List of explanations separated by `|`, in the format `id) Text.`. Each item in `Options` (or each relatable element in `R` and `O`) must have its corresponding explanation.

    **Field 5: `Hints`**
    *   **Central Directive:** The hint must **ACTIVATE**, not **DELIVER**. It is forbidden to contain the answer.
    *   **Technical Format:** `Title<br>Content.` (`<br>` is mandatory). For multiple hints, separate them with `|`.

    **Field 6: `Tags`**
    *   Words separated by a space. **MUST OBLIGATORILY contain two key tags**:
        1.  The **quiz type code** in uppercase (`B`, `SC`, `MC`, `O`, `F`, `R`, `AE`).
        2.  The **cognitive level tag**: `N1_Remember`, `N2_Understand`, `N3_Apply`, `N4_Analyze`, `N5_Evaluate`, `N6_Create`.
    *   Additionally, it must include relevant thematic tags (e.g., `Biology`, `History`).

#### **2.3. Complete Example Canon (Gold Standard by Type and Level)**

**--- TYPE B (Basic Cloze) ---**
```csv
What is the largest and deepest ocean in the world?;;{{c1::The Pacific Ocean}};The Pacific Ocean covers approximately one-third of the Earth's surface and contains the deepest known point, the Mariana Trench.;Geography<br>Its name was given by Ferdinand Magellan, who found it "peaceful" during his voyage.;B N1_Remember Geography
```

**--- TYPE AE (Exact Answer Cloze) ---**
```csv
Anatomy of the Nervous System;;The fundamental unit of the {{c1::nervous}} system is the {{c2::neuron}}{{c3::}};Neurons are specialized cells that transmit electrical and chemical signals, forming the basis of communication in the nervous system.;Cell Function<br>They are responsible for transmitting nerve impulses. | Primary Location<br>They are found mainly in the brain, spinal cord, and nerves.;AE N1_Remember Biology
```

**--- TYPE SC (Single Choice Cloze) ---**
```csv
Basic Chemistry;a) Ag | b) Au | c) Fe | d) Cu;The chemical symbol for gold is {{c1::Au}}.;a) Incorrect. Ag is the symbol for Silver. | b) Correct! Au comes from the Latin 'Aurum'. | c) Incorrect. Fe is the symbol for Iron. | d) Incorrect. Cu is the symbol for Copper.;Origin of Name<br>The symbol 'Au' derives from the Latin word for gold, 'Aurum'.;SC N2_Understand Chemistry
```

**--- TYPE MC (Multiple Choice Cloze) ---**
```csv
Geography of Europe;a) Germany | b) France | c) Italy | d) Switzerland | e) United Kingdom;Some countries belonging to the European Union are {{c1::Germany}}, {{c1::France}} and {{c1::Italy}}, but {{c2::Switzerland}} is not a member.;a) Correct, it is one of the founding members. | b) Correct, another key founding member. | c) Correct, also a founding member. | d) Incorrect. Switzerland is neutral and does not belong to the EU. | e) Incorrect. The United Kingdom left the EU (Brexit).;Brexit<br>One of the listed countries recently left the EU.;MC N4_Analyze Geography Politics
```

**--- TYPE O (Ordering Cloze) ---**
```csv
Cellular Processes;1. Prophase | 2. Metaphase | 3. Anaphase | 4. Telophase | 5. G1 | 6. S | 7. G2;Order of Mitosis: {{c1::Prophase}} -> {{c1::Metaphase}} -> {{c1::Anafase}} -> {{c1::Telophase}}.<br><br>Order of Cell Cycle: {{c2::G1}} -> {{c2::S}} -> {{c2::G2}};1. Prophase: Chromatin condenses... | 2. Metaphase: Chromosomes align... | 3. Anafase: Sister chromatids separate... | 4. Telophase: Chromosomes decondense...| 5. The cell grows... | 6. DNA replicates... | 7. The cell prepares for division...;Mitosis Hint<br>Remember the acronym 'PMAT' for the phases.;O N3_Apply Biology
```

**--- TYPE F (Phrase Cloze) ---**
```csv
Quote by Albert Einstein;Imagination | is | more | important | than | knowledge | but | not | know | science;{{c1::Imagination}} {{c1::is}} {{c1::more}} {{c2::important}} {{c2::than}} {{c2::knowledge}}.{{c3::}};This phrase highlights that creativity (imagination) is more fundamental for progress than the simple accumulation of data (knowledge).;Context<br>Said by a famous physicist known for his theory of relativity.;F N2_Understand Philosophy Science
```

**--- TYPE R (Relate Cloze) ---**
```csv
Match each phrase with its missing term.;1. Sahara | 2. Everest | 3. Paris | 4. Amazon | 5. Nile | 6. Qatar;a) The capital of France is {{c1::Paris}}. | b) The longest river in America is the {{c1::Amazon}}. | c) The longest river in the world is the {{c2::Nile}}. | d) The host country for the 2022 World Cup was {{c2::Qatar}}.;a) Paris is home to the Eiffel Tower... | b) The Amazon has the largest basin... | c) The Nile flows through 11 countries... | d) Qatar is an oil-rich country...;Hint France<br>Known as the "City of Love" | Hint Amazon<br>The world's most voluminous river | Hint Nile<br>Flows through Egypt | Hint Qatar<br>Arab country hosting the 2022 World Cup;R N3_Apply Geography History
```

**Final Directive:**
Your performance is measured by 1-to-1 adherence to this dual protocol. First deliver the SQ4R guide, and then, immediately after, the CSV code block with the complete cloze learning path, using **semicolon** as the separator. Proceed.

Once you have the CSV output from the AI, use the browser extension mentioned below to import it into Anki.

## 📦 How to Install & Use

### ⚠️ Important Requirement for Keyboard Navigation

For the keyboard navigation features (using W, A, S, D, etc.) to work, you **must install the "Review Hotkeys" add-on** for Anki.

1.  **Install the Add-on:**
    - Go to the add-on page: [Review Hotkeys - Remap Review Buttons](https://ankiweb.net/shared/info/1762336370)
    - Use the code **1762336370** in Anki's `Tools > Add-ons > Get Add-ons...` dialog.

2.  **Configure the Add-on:**
    - After installing, go to `Tools > Add-ons`, select "Review Hotkeys," and click `Config`.
    - You need to **disable or clear** the default assignments for any keys you want to use within the template (like `W`, `A`, `S`, `D`, `Spacebar`, `Enter`). This prevents conflicts and allows the template's internal navigation to take control.

### For End-Users (Easy Install)

The easiest way to install is to download the pre-packaged deck file:

1.  Go to the [**Releases Page**](https://github.com/LeonelRFF/Quiz-Interactive/releases).
2.  Download the `Quiz_Interactive.apkg` file from the latest release.
3.  Open Anki, go to `File > Import`, and select the downloaded `.apkg` file. This will add the card types and a sample deck to your collection.

### For Power-Users (Manual Copy/Paste)

If you prefer to copy the code manually:

1.  Navigate to the `_build` folder in this repository.
2.  Choose the template (`basic` or `cloze`).
3.  Copy the content of `front.html` into the "Front Template" field in Anki.
4.  Copy the content of `back.html` into the "Back Template" field.
5.  The "Styling" field can be left empty, as styles are included for portability.

## 🛠️ For Developers (Building from Source)

This project uses Node.js and Python for its build process.

1.  Clone the repository: `git clone https://github.com/your-user/Quiz-Interactive.git`
2.  Navigate into the directory: `cd Quiz-Interactive`
3.  Install dependencies: `npm install`
4.  Run the build script: `npm run build`

The final compiled files will be generated in the `_build/` directory.


## ❤️ Support This Project

If you find this project useful and want to support its continued development, there are a few ways you can help:

- **⭐ Star the repository on GitHub:** This is the easiest way to show your appreciation and helps increase the project's visibility.
- **🗣️ Spread the word:** Share the template with other Anki users who might find it useful.
- **💸 Donate:** Your financial support helps me dedicate more time to new features, bug fixes, and providing support. Any amount is greatly appreciated!

<a href="https://github.com/sponsors/LeonelRFF" target="_blank">
    <img src="https://img.shields.io/badge/Sponsor_on_GitHub-%E2%9D%A4-EA4AAA?style=for-the-badge&logo=github" alt="Sponsor on GitHub">
</a>
<a href="https://ko-fi.com/leonelrff" target="_blank">
    <img src="https://img.shields.io/badge/Buy_me_a_Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Buy me a Ko-fi">
</a>
<a href="https://www.buymeacoffee.com/leonelrff" target="_blank">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
</a>

## 📄 License

This project is licensed under the GPL-3.0 License. See the [LICENSE](./LICENSE) file for details.

---
*Crafted with ❤️ by Leonel Rodriguez.*