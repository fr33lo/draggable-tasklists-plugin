import { App, PluginSettingTab, Setting } from 'obsidian';
import DraggableTasklistPlugin from './main';

export interface DraggableTasklistSettings {
    enableInPreviewMode: boolean;
    saveOrderAutomatically: boolean;
    dragHandleStyle: string;
    customDragHandleClass: string;
    animationSpeed: number;
    indentationMarker: boolean;
}

export class DraggableTasklistSettingTab extends PluginSettingTab {
    plugin: DraggableTasklistPlugin;

    constructor(app: App, plugin: DraggableTasklistPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Draggable Tasklists Settings' });

        new Setting(containerEl)
            .setName('Enable in Preview Mode')
            .setDesc('Enable draggable tasklists in preview/reading mode')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableInPreviewMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableInPreviewMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.initializeDraggableTasks();
                }));

        new Setting(containerEl)
            .setName('Save Order Automatically')
            .setDesc('Automatically save the new task order when tasks are reordered')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.saveOrderAutomatically)
                .onChange(async (value) => {
                    this.plugin.settings.saveOrderAutomatically = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Drag Handle Style')
            .setDesc('Choose the style of the drag handle cursor')
            .addDropdown(dropdown => dropdown
                .addOption('grab', 'Grab')
                .addOption('move', 'Move')
                .addOption('pointer', 'Pointer')
                .setValue(this.plugin.settings.dragHandleStyle)
                .onChange(async (value) => {
                    this.plugin.settings.dragHandleStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.registerStyles();
                }));

        new Setting(containerEl)
            .setName('Custom Drag Handle Class')
            .setDesc('Enter a custom CSS class for the drag handle (optional)')
            .addText(text => text
                .setPlaceholder('custom-drag-handle')
                .setValue(this.plugin.settings.customDragHandleClass)
                .onChange(async (value) => {
                    this.plugin.settings.customDragHandleClass = value;
                    await this.plugin.saveSettings();
                    this.plugin.registerStyles();
                }));

        new Setting(containerEl)
            .setName('Animation Speed')
            .setDesc('Set the speed of drag animations (in milliseconds)')
            .addSlider(slider => slider
                .setLimits(0, 500, 50)
                .setValue(this.plugin.settings.animationSpeed)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.animationSpeed = value;
                    await this.plugin.saveSettings();
                    this.plugin.registerStyles();
                }));

        new Setting(containerEl)
            .setName('Indentation Marker')
            .setDesc('Show a vertical line to indicate task indentation level')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.indentationMarker)
                .onChange(async (value) => {
                    this.plugin.settings.indentationMarker = value;
                    await this.plugin.saveSettings();
                    this.plugin.registerStyles();
                    this.plugin.initializeDraggableTasks();
                }));

        // Add section for usage instructions
        containerEl.createEl('h3', { text: 'Usage' });
        const usageEl = containerEl.createEl('div');
        usageEl.innerHTML = `
            <p>To use the draggable tasklists:</p>
            <ol>
                <li>Create a task list in your note using the standard Markdown syntax: <code>- [ ] Task item</code></li>
                <li>In preview mode, hover over a task to see the drag handle (⋮⋮)</li>
                <li>Drag and drop tasks to reorder them</li>
                <li>Use the command "Toggle Draggable Tasklists" to enable/disable in the current note</li>
            </ol>
        `;

        // Add a button to reset settings
        new Setting(containerEl)
            .setName('Reset Settings')
            .setDesc('Restore default settings')
            .addButton(button => button
                .setButtonText('Reset')
                .setWarning()
                .onClick(async () => {
                    this.plugin.settings = {
                        enableInPreviewMode: true,
                        saveOrderAutomatically: true,
                        dragHandleStyle: 'grab',
                        customDragHandleClass: '',
                        animationSpeed: 200,
                        indentationMarker: true,
                    };
                    await this.plugin.saveSettings();
                    this.display();
                    this.plugin.registerStyles();
                    this.plugin.initializeDraggableTasks();
                }));
    }
}
