BrailleBridge

Bridging Printed Text to Braille, Accessibly

BrailleBridge is a web application designed to make printed information accessible to blind and visually impaired users. It converts scanned documents, PDFs, and photos into Braille-ready digital files that can be used with Braille embossers, refreshable Braille displays, and tactile e-readers.

This project prioritizes **accessibility, clarity, and reliability** over visual complexity. It is built with a strong focus on real-world assistive technology use cases in education, libraries, and inclusive institutions.

---

## 🌍 Problem Statement

Despite the availability of OCR and document digitization tools, access to **high-quality Braille output** remains limited. Existing solutions are often:

* Expensive or proprietary
* Difficult to use with screen readers
* Not designed for end-to-end Braille workflows

BrailleBridge addresses this gap by providing an **accessible, browser-based pipeline** from printed text to Braille-ready output.

---

## ✨ Core Features

### 📄 Input Support

* Scanned PDFs
* Images (JPG, PNG)
* Photos captured with a camera

### 🔍 Intelligent OCR & Preprocessing

* Automatic text detection (OCR)
* Image cleanup (rotation, deskewing, contrast improvement)
* Architecture designed for multilingual expansion

  * English (default)
  * Uzbek & Russian (planned)

### ⠿ Braille Conversion

* Unified English Braille (UEB)
* Grade 1 and Grade 2 Braille support
* Preserves paragraphs, headings, and basic structure
* Editable text preview before conversion

### 📦 Output Formats

* BRF (Braille Ready Format)
* Embosser-compatible files
* In-browser Braille preview
* Downloadable files for:

  * Braille embossers
  * Refreshable Braille displays
  * Tactile e-readers

---

## ♿ Accessibility-First Design

BrailleBridge is built with accessibility as a **core requirement**, not an afterthought:

* Full screen-reader compatibility
* Keyboard-only navigation
* High-contrast interface
* Large buttons and clear labels
* Audio feedback for upload and conversion status

The UI follows a simple, step-based flow:

1. Upload document
2. Review detected text
3. Select Braille options
4. Download output

---

## 🧠 Technical Architecture

### Frontend

* React + TypeScript
* Vite for fast development
* Tailwind CSS & shadcn/ui
* Responsive design (desktop & mobile)

### Backend (Conceptual)

* OCR pipeline for text extraction
* Braille translation logic compatible with Liblouis
* Temporary cloud file storage with automatic deletion
* Modular design for future features:

  * Math Braille
  * Offline mode
  * Additional languages

---

## 🔐 Non-Functional Requirements

* Secure file handling
* Automatic cleanup of uploaded data
* Fast processing with real-time status updates
* Clean, maintainable, modular codebase

---

## 🎓 Educational & Social Impact

BrailleBridge is designed for:

* Blind and visually impaired individuals
* Schools and universities
* Libraries and accessibility centers
* Inclusive education initiatives

The project demonstrates the application of computer science to **social good**, combining frontend engineering, accessibility standards, and assistive technology principles.

---

## 🚀 Getting Started (Local Development)

```bash
# Clone the repository
git clone https://github.com/kattabeknorbaev/BrailleBridge.git

# Navigate into the project
cd braillebridge

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🌱 Future Work

* Support for additional languages
* Mathematical and scientific Braille notation
* Offline and low-bandwidth support
* Direct embosser integration

---
## Changelog

### v1.1
- Added conversion summary report
- Added side-by-side text and Braille preview
- Improved Braille grade explanations
- Added Known Limitations section
- Improved export file naming

### v1.0
- OCR text extraction
- Grade 1 and Grade 2 Braille conversion
- BRF, DXP, Unicode output
- Accessibility-first design
---

## 📌 Note

BrailleBridge is an evolving project created with a strong emphasis on **inclusion, accessibility, and real-world usability**. It reflects both technical competence and a commitment to building technology that serves underrepresented communities.

---

*BrailleBridge — connecting information to touch.*
