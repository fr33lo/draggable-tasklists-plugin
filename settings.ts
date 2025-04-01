// settings.js
import { App, PluginSettingTab, Setting } from 'obsidian';

export class DraggableTasklistSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
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
                .addOption('custom', 'Custom CSS Class')
                .setValue(this.plugin.settings.dragHandleStyle)
                .onChange(async (value) => {
                    this.plugin.settings.dragHandleStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.registerStyles();
                }));

        // Only show custom CSS class setting if 'custom' is selected
        if (this.plugin.settings.dragHandleStyle === 'custom') {
            new Setting(containerEl)
                .setName('Custom Drag Handle Class')
                .setDesc('Enter a custom CSS class for the drag handle')
                .addText(text => text
                    .setValue(this.plugin.settings.customDragHandleClass)
                    .onChange(async (value) => {
                        this.plugin.settings.customDragHandleClass = value;
                        await this.plugin.saveSettings();
                        this.plugin.registerStyles();
                    }));
        }

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
                    this.plugin.initializeDraggableTasks();
                }));

        // Add a button to reset settings
        new Setting(containerEl)
            .setName('Reset Settings')
            .setDesc('Restore default settings')
            .addButton(button => button
                .setButtonText('Reset')
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
