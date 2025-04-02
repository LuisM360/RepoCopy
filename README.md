# RepoCopy

A simple desktop application built with Electron and React designed to streamline the process of gathering and consolidating code context from local project files. It allows developers to quickly select relevant files and folders, preview the combined content, and copy it for use in AI prompts, documentation, or code sharing.

<p align="center">
  <img src="assets/demo2.gif" alt="Planned Demo" width="600"/>
</p>

## Features

- **Project Selection:** Easily select project folders.
- **File Explorer:** Visually browse and select files/folders.
- **Content Preview:** Preview combined content of selected files.
- **Clipboard Copy:** Copy formatted content to the clipboard for use in AI prompts, documentation, etc.

## Planned Features

- File/Folder filtering
- Global ignore filters (.gitignore support)
- Settings panel (Dark Mode)
- File name/path view
- Token count calculation

## Tech Stack

- Electron
- React (using Vite)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide React Icons

## Getting Started

### Prerequisites

- Node.js v22.0.0 or higher
- npm (or yarn/pnpm/bun)

### Installation

1.  Clone the repository:
    ```bash
    git clone
    cd RepoCopy
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

```bash
npm run dev
```

This command starts the Vite development server for the React UI and launches the Electron application simultaneously.

### Building for Production

```bash
npm run build
```

This compiles the React UI and Electron main/preload scripts.

### Packaging for Distribution (Windows)

```bash
npm run dist:win
```

This builds the application and creates a Windows installer/executable using electron-builder.

## Project Status

🚧 **Early Development** - This project is in its initial development phase. Core functionality is present, but expect changes, potential bugs, and ongoing feature implementation.

## Contributing

Contribution guidelines are not yet established as the project is in early development. Please check back later or open an issue to discuss potential contributions.

## License

[License Type] - License details to be added.

---

_Note: This is an initial README and will be updated as the project evolves and features are implemented._
