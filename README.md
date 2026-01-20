# SiteSwitcher

A cross-platform CLI tool for managing system hosts files by fetching, caching, and merging remote hosts configurations with local overrides.

## Features

- Fetch and cache remote hosts configurations
- Merge remote hosts with local overrides
- Override specific hostnames while keeping others from remote
- Cross-platform support (macOS, Linux, Windows)
- Editor integration for easy configuration editing
- Intelligent caching with 10-minute TTL
- Build-time configuration embedding for team defaults
- Modular configuration system (default → build-time → user)

## Installation

TODO

### Build from Source

> [Bun](https://bun.sh) runtime installed (only required for building from source)

```bash
# Clone the repository
git clone <repository-url>
cd SiteSwitcher

# Install dependencies
bun install

# Build for your platform
bun run build:macos-arm64  # macOS Apple Silicon
bun run build:macos-x64    # macOS Intel
bun run build:linux        # Linux
bun run build:windows      # Windows

# Or build for all platforms
bun run build:all

# The binaries will be in the dist/ directory

## Test running binary in dist directory
## Change siteswitcher-macos-arm64 to the binary supported on your system
./dist/siteswitcher-macos-arm64 help

## For now you can add an alias to your ~/.zshrc file

alias switch="path/to/repo/dist/siteswitcher-macos-arm64"
# OR 
alias siteswitcher="path/to/repo/dist/siteswitcher-macos-arm64"
```

## Usage

### Quick Start

```bash
# List configured remote hosts
siteswitcher remote list

# Fetch a specific remote hosts configuration
siteswitcher remote fetch qa1

# Fetch all remote hosts configurations
siteswitcher remote fetch

# Apply a remote hosts configuration (with local overrides)
siteswitcher set qa1
# or
siteswitcher local set qa1

# Apply a remote hosts configuration (without local overrides)
siteswitcher remote set qa1

# Edit local overrides
siteswitcher local edit

# Show currently active configuration
siteswitcher active

# Show system hosts file contents
siteswitcher system show

# Open system hosts file in editor
siteswitcher system open

# Restore system hosts file to default values
siteswitcher system restore
```

### Commands

Commands are organized into namespaces:
- **`local`**: Commands that work with local overrides
- **`remote`**: Commands that work with remote hosts configurations
- **`system`**: Commands that work with the system hosts file
- **`config`**: Commands for managing configuration

#### `remote list`
Display all configured remote hosts with their status and last fetch time.

```bash
siteswitcher remote list
```

#### `remote fetch [name]`
Fetch and cache remote hosts configurations. If no name is provided, fetches all configured remotes.

```bash
siteswitcher remote fetch qa1      # Fetch specific configuration
siteswitcher remote fetch          # Fetch all configurations
```

#### `set <name>` / `local set <name>`
Apply a remote hosts configuration by merging it with local overrides and updating the system hosts file.

```bash
siteswitcher set qa1
# or
siteswitcher local set qa1
```

This command:
1. Loads the cached remote hosts file
2. Loads your local overrides
3. Merges them (overrides take precedence)
4. Writes to system hosts file (requires sudo)

#### `remote set <name>`
Apply a remote hosts configuration without local overrides.

```bash
siteswitcher remote set qa1
```

This command applies only the remote hosts configuration, ignoring any local overrides.

#### `local edit`
Open the local overrides file in your configured editor.

```bash
siteswitcher local edit
```

Add your custom host entries here. They will override any matching entries from remote hosts files.

#### `system show`
Display the contents of the system hosts file with line numbers.

```bash
siteswitcher system show
```

#### `system open`
Open the system hosts file in your editor.

```bash
siteswitcher system open
```

#### `system restore`
Reset the system hosts file to default values (localhost entries only).

```bash
siteswitcher system restore
```

This command:
1. Applies the default hosts file content (localhost entries)
2. Clears the active configuration name
3. Useful for resetting to a clean state

#### `active`
Show the currently active remote hosts configuration name.

```bash
siteswitcher active
```

#### `config list`
Display the current configuration as JSON.

```bash
siteswitcher config list
```

#### `config open`
Open the configuration file in your editor.

```bash
siteswitcher config open
```

#### `config set <key=value>`
Set a configuration value.

```bash
siteswitcher config set editor=vim
siteswitcher config set remoteHostsUris.qa1=https://example.com/new-url
```

#### `config restore`
Restore configuration to default values, removing all user customizations.

```bash
siteswitcher config restore
```

#### `version`
Display version information.

```bash
siteswitcher version
```

## Configuration

SiteSwitcher stores its configuration and cache in `~/.siteswitcher/`.

### Configuration Files

SiteSwitcher uses a layered configuration system:

1. **Default config** (hardcoded) - Base defaults with no remote hosts
2. **Build-time config** (`config.local.json`) - Team defaults embedded in binary
3. **User config** (`~/.siteswitcher/config.json`) - Individual user overrides (highest priority)

#### User Configuration File

The user configuration file is located at `~/.siteswitcher/config.json`.

```json
{
  "version": "1.0",
  "editor": null,
  "hostsPath": "/etc/hosts",
  "remoteHostsUris": {
    "qa1": "https://example.com/hosts/qa1",
    "qa2": "https://example.com/hosts/qa2",
    "qa3": "https://example.com/hosts/qa3",
    "preprod": "https://example.com/hosts/staging",
    "production": "https://example.com/hosts/prod-region-1"
  }
}
```

#### Configuration Options

- **version**: Configuration schema version
- **editor**: Editor to use (null = auto-detect from $VISUAL, $EDITOR, or platform default)
- **hostsPath**: Path to system hosts file
- **remoteHostsUris**: Object mapping names to remote hosts file URLs

#### Build-Time Configuration

For team distribution, you can include default remote hosts URIs in the binary:

1. Create `config.local.json` in the project root with your team's remote hosts
2. Build the binary - the config will be embedded automatically
3. Distribute the binary - it will include your team defaults

The build process automatically embeds `config.local.json` into the compiled binary, so team members don't need to configure remote hosts manually.

**Note**: `config.local.json` is gitignored by default to keep private URLs out of the repository.

### Directory Structure

```
~/.siteswitcher/
├── config.json                   # Configuration file
├── overrides.hosts              # Local overrides
├── active.txt                   # Currently active configuration name
├── cache/
│   ├── qa1.hosts               # Cached remote hosts files
│   ├── qa1.meta.json          # Cache metadata (timestamps)
│   └── ...
└── temp/
    └── merged.hosts            # Temporary merged file
```

## How It Works

### Caching

Remote hosts files are cached locally for 10 minutes. After the cache expires, the next `set` or `fetch` operation will automatically fetch fresh content from the remote URL.

Cache metadata is stored in `~/.siteswitcher/cache/<name>.meta.json` and includes:
- `lastFetched`: Timestamp of last successful fetch
- `url`: The URL that was fetched

### Merge Logic

When you run `siteswitcher set <name>` or `siteswitcher local set <name>`, the tool:

1. **Loads overrides**: Reads `~/.siteswitcher/overrides.hosts`
2. **Loads remote hosts**: Reads cached remote hosts file
3. **Merges**:
   - Adds all override entries at the top
   - For each remote hosts entry:
     - If hostname matches an override: comments it out
     - Otherwise: keeps it as-is
4. **Applies**: Writes merged content to system hosts file (requires sudo)

#### Example

**Overrides file** (`~/.siteswitcher/overrides.hosts`):
```
192.168.1.100 myapp.local
10.0.0.50 api.myapp.local
```

**Remote hosts file** (qa1):
```
127.0.0.1 localhost
10.0.1.100 api.myapp.local
10.0.1.200 db.myapp.local
```

**Merged result** (written to `/etc/hosts`):
```
# === OVERRIDES ===
192.168.1.100 myapp.local
10.0.0.50 api.myapp.local

# === REMOTE HOSTS (qa1) ===
127.0.0.1 localhost
# 10.0.1.100 api.myapp.local  # Overridden above
10.0.1.200 db.myapp.local
```

## Editor Detection

The tool detects your editor in this order:

1. `editor` setting in config.json
2. `$VISUAL` environment variable
3. `$EDITOR` environment variable
4. Platform default:
   - macOS/Linux: `vi`
   - Windows: `notepad`

## Platform Support

- **macOS**: Tested on Apple Silicon and Intel
- **Linux**: Tested on x64
- **Windows**: Tested on x64

Default hosts file paths:
- macOS/Linux: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

## Troubleshooting

### Permission Denied

If you get permission errors when running `siteswitcher set` or `siteswitcher local set`:
- The tool automatically uses `sudo` to write to the system hosts file
- You'll be prompted for your password

### Remote Fetch Fails

If fetching remote hosts fails when running `siteswitcher remote fetch`:
- Check your internet connection
- Verify the URL in config is correct
- The tool will fall back to cached versions if available

### Editor Not Opening

If the editor doesn't open:
- Set your preferred editor: `siteswitcher config set editor=vim`
- Or set the `$EDITOR` environment variable

## Development

### Requirements

- Bun 1.0+

