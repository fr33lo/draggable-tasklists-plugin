# Draggable Tasklists Plugin for Obsidian

![GitHub release (latest by date)](https://img.shields.io/github/v/release/fr33lo/draggable-tasklists-plugin)
![GitHub issues](https://img.shields.io/github/issues/fr33lo/draggable-tasklists-plugin)
![GitHub](https://img.shields.io/github/license/fr33lo/draggable-tasklists-plugin)

The "Draggable Tasklists" plugin for Obsidian allows you to make tasklists within your notes draggable in preview mode. This enhances your task management and note organization capabilities by providing a simple drag-and-drop interface for reordering tasks.

## Features

- **Drag and Drop**: Reorder task list items by dragging them in preview mode
- **Visual Feedback**: Clear visual indicators with drag handles and hover effects
- **Automatic Saving**: Optionally save reordered tasks automatically to your notes
- **Customizable**: Adjust drag handle styles, animation speed, and visual markers
- **Indentation Support**: Visual markers for nested task lists
- **Command Toggle**: Toggle draggable functionality on/off per note

## Installation

### Manual Installation
1. Download the latest release from the [GitHub releases page](https://github.com/fr33lo/draggable-tasklists-plugin/releases)
2. Extract the files to your vault's `.obsidian/plugins/draggable-tasklists/` folder
3. Enable the plugin in Obsidian's Community Plugins settings

### From Community Plugins
*Coming soon - plugin is currently in development*

## Usage

1. **Create Task Lists**: Use standard Markdown syntax in your notes:
   ```markdown
   - [ ] First task
   - [ ] Second task
   - [x] Completed task
   - [ ] Another task
   ```

2. **Switch to Preview Mode**: The draggable functionality works in preview/reading mode

3. **Drag and Drop**: 
   - Hover over a task item to see the drag handle (⋮⋮)
   - Click and drag the handle to reorder tasks
   - Drop the task in its new position

4. **Toggle Functionality**: Use the command palette (Ctrl/Cmd + P) and search for "Toggle Draggable Tasklists" to enable/disable for the current note

## Settings

Access the plugin settings through Obsidian's Settings → Community Plugins → Draggable Tasklists:

- **Enable in Preview Mode**: Enable/disable draggable functionality in preview mode
- **Save Order Automatically**: Automatically save changes to your note file
- **Drag Handle Style**: Choose cursor style (grab, move, pointer)
- **Custom Drag Handle Class**: Add custom CSS classes for styling
- **Animation Speed**: Adjust transition and animation timing (0-500ms)
- **Indentation Marker**: Show visual markers for nested task levels

## Customization

You can customize the appearance by modifying the included `styles.css` or adding custom CSS to your vault's CSS snippets:

```css
.task-list-item.draggable-task {
    /* Your custom styles */
}

.task-list-item.draggable-task .drag-handle {
    /* Custom drag handle styles */
}
```

## Keyboard Shortcuts

- **Toggle Draggable**: No default shortcut (can be set in Obsidian's hotkey settings)

## Known Issues

- Dragging only works in preview mode, not in edit mode
- Complex nested structures may require manual adjustment
- Large task lists (100+ items) may experience performance impacts

## Troubleshooting

**Tasks aren't draggable:**
- Ensure you're in preview mode
- Check that the plugin is enabled in settings
- Verify the tasks use proper Markdown checkbox syntax

**Changes aren't saving:**
- Enable "Save Order Automatically" in settings
- Check file permissions if using sync services

**Visual issues:**
- Try adjusting the animation speed in settings
- Check for CSS conflicts with other plugins or themes

## Development

### Building the Plugin

```bash
npm install
npm run build
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter issues or have suggestions:

- Open an issue on [GitHub](https://github.com/fr33lo/draggable-tasklists-plugin/issues)
- Check existing issues first to avoid duplicates
- Provide detailed reproduction steps and system information

## Changelog

### v0.1.2
- Fixed TypeScript type issues
- Improved drag and drop reliability
- Enhanced visual feedback and animations
- Better event listener cleanup
- Fixed task order parsing and updating

### v0.1.1
- Initial release
- Basic drag and drop functionality
- Settings panel
- Preview mode support

## License

This plugin is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

- **fr33lo**
- GitHub: [fr33lo](https://github.com/fr33lo)
- Website: [freelo.gay](https://freelo.gay)

---

Enjoy using the Draggable Tasklists plugin to enhance your task management workflow in Obsidian!
