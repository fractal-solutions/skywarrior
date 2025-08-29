# SkyWarrior Game

Welcome to SkyWarrior, a thrilling 3D aerial combat game!

## Getting Started

Follow these steps to get the game up and running on your local machine.

### 1. Download the Repository

First, you need to download the game's source code. You can do this by cloning the repository using Git:

```bash
git clone https://github.com/fractal-solutions/skywarrior.git
cd skywarrior
```
*(Note: Replace `https://github.com/fractal-solutions/skywarrior.git` with the actual repository URL if it's hosted elsewhere.)*

### 2. Run the Game Executable

The game requires a backend server to run. We provide pre-built executables for Windows and Linux.

#### For Windows Users:

Locate the `skywarrior-windows.exe` file in the root directory of the downloaded repository. Double-click it to run the server.

#### For Linux Users:

Locate the `skywarrior-linux` executable file in the root directory of the downloaded repository. Open a terminal, navigate to the repository's root directory, and run the executable:

```bash
./skywarrior-linux
```
*(You might need to give it execute permissions first: `chmod +x skywarrior-linux`)*

### 3. Open the Game in Your Browser

Once the server is running, open your web browser and navigate to:

```
http://localhost:3000
```

The game should now load in your browser. If port 3000 is already in use, the server might start on a different port (e.g., 3001, 8080). Check the server's console output for the exact port number if `localhost:3000` doesn't work.

Enjoy the game!
