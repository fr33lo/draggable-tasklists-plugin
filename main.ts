// main.ts
import { Plugin, MarkdownView, Notice } from 'obsidian';
import { DraggableTasklistSettingTab } from './settings';

export default class DraggableTasklistPlugin extends Plugin {
    settings = {
        enableInPreviewMode: true,
        saveOrderAutomatically: true,
        dragHandleStyle: 'grab', // grab, move, custom
        customDragHandleClass: '',
        animationSpeed: 200,
        indentationMarker: true,
    }

    async onload() {
        console.log('Loading Draggable Tasklist plugin');

        // Load settings
        await this.loadSettings();

        // Register settings tab
        this.addSettingTab(new DraggableTasklistSettingTab(this.app, this));

        // Register CSS styles
        this.registerStyles();

        // Register events
        this.registerMarkdownPostProcessor();
        this.registerEvents();

        // Add command to toggle draggable mode
        this.addCommand({
            id: 'toggle-draggable-tasklists',
            name: 'Toggle Draggable Tasklists',
            callback: () => this.toggleDraggable(),
        });

        // Show welcome notice
        new Notice('Draggable Tasklists plugin loaded');
    }

    onunload() {
        console.log('Unloading Draggable Tasklist plugin');
        // Clean up any event listeners or DOM modifications
        this.cleanupDraggables();
    }

    async loadSettings() {
        this.settings = Object.assign({}, this.settings, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    registerStyles() {
        // Add the required CSS to the document
        document.head.appendChild(
            createStyleElement(`
                .task-list-item.draggable {
                    cursor: ${this.settings.dragHandleStyle};
                    position: relative;
                    padding-left: 5px;
                    transition: background-color 0.2s ease;
                }
                
                .task-list-item.draggable:hover {
                    background-color: var(--background-secondary);
                }
                
                .task-list-item.dragging {
                    opacity: 0.5;
                    background-color: var(--interactive-accent);
                }
                
                .task-list-item .drag-handle {
                    display: none;
                    position: absolute;
                    left: -20px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }
                
                .task-list-item.draggable:hover .drag-handle {
                    display: inline-block;
                }
                
                .task-list-item.draggable.indentation-marker {
                    border-left: 2px solid var(--interactive-accent-hover);
                }
            `)
        );
    }

    registerMarkdownPostProcessor() {
        // Process markdown to inject the draggable functionality
        this.registerMarkdownPostProcessor((el, ctx) => {
            // Only process in preview mode if enabled
            if (!this.settings.enableInPreviewMode && ctx.frontmatter?.draggable !== true) {
                return;
            }

            const taskListItems = el.querySelectorAll('.task-list-item');

            if (taskListItems.length === 0) {
                return;
            }

            // Add draggable functionality to each task list item
            taskListItems.forEach((item, index) => {
                this.makeTaskItemDraggable(item, index);
            });
        });
    }

    registerEvents() {
        // Watch for changes to the active leaf
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                // Re-initialize draggable tasks when the active leaf changes
                this.initializeDraggableTasks();
            })
        );

        // Watch for layout changes
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                // Re-initialize when layout changes
                this.initializeDraggableTasks();
            })
        );
    }

    makeTaskItemDraggable(item, index) {
        // Add draggable class and drag handle
        item.addClass('draggable');
        
        if (this.settings.indentationMarker) {
            item.addClass('indentation-marker');
        }
        
        // Create the drag handle icon
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle ' + this.settings.customDragHandleClass;
        dragHandle.innerHTML = '⋮⋮'; // Simple drag handle icon
        item.prepend(dragHandle);
        
        // Set data attributes for tracking
        item.setAttribute('data-index', index);
        
        // Add the draggable attribute
        item.setAttribute('draggable', 'true');
        
        // Add drag events
        item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        item.addEventListener('dragover', (e) => this.handleDragOver(e));
        item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        item.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragStart(e) {
        const target = e.target.closest('.task-list-item');
        target.addClass('dragging');
        e.dataTransfer.setData('text/plain', target.getAttribute('data-index'));
        
        // For better visual feedback
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        const target = e.target.closest('.task-list-item');
        target.removeClass('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        const target = e.target.closest('.task-list-item');
        if (target && !target.hasClass('dragging')) {
            target.addClass('drag-over');
        }
    }

    handleDragLeave(e) {
        const target = e.target.closest('.task-list-item');
        if (target) {
            target.removeClass('drag-over');
        }
    }

    async handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.task-list-item');
        
        if (!target) return;
        
        target.removeClass('drag-over');
        
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const dropIndex = parseInt(target.getAttribute('data-index'));
        
        if (draggedIndex === dropIndex) return;
        
        // Update the tasks order in the document
        await this.updateTaskOrder(draggedIndex, dropIndex);
        
        // Refresh the view
        this.initializeDraggableTasks();
    }

    async updateTaskOrder(fromIndex, toIndex) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        if (!view) return;

        const editor = view.editor;
        const doc = editor.getValue();
        
        // Parse the document to find task list items
        const lines = doc.split('\n');
        let taskLines = [];
        
        // Find all task list lines and their indentation levels
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const taskMatch = line.match(/^(\s*)- \[([ x])\] (.*)/);
            
            if (taskMatch) {
                taskLines.push({
                    lineNumber: i,
                    indentation: taskMatch[1].length,
                    checked: taskMatch[2] === 'x',
                    text: taskMatch[3],
                    fullLine: line
                });
            }
        }
        
        // Perform the move operation
        if (fromIndex < taskLines.length && toIndex < taskLines.length) {
            const itemToMove = taskLines[fromIndex];
            taskLines.splice(fromIndex, 1);
            taskLines.splice(toIndex, 0, itemToMove);
            
            // Update the document
            const newLines = [...lines];
            
            for (let i = 0; i < taskLines.length; i++) {
                const task = taskLines[i];
                const indentation = " ".repeat(task.indentation);
                const checkbox = task.checked ? 'x' : ' ';
                newLines[task.lineNumber] = `${indentation}- [${checkbox}] ${task.text}`;
            }
            
            const newDoc = newLines.join('\n');
            editor.setValue(newDoc);
            
            if (this.settings.saveOrderAutomatically) {
                await this.app.vault.modify(view.file, newDoc);
                new Notice('Task order updated');
            }
        }
    }

    initializeDraggableTasks() {
        // Initialize draggable tasklists in the active view
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        if (!view) return;
        
        // Clean up existing draggables first
        this.cleanupDraggables();
        
        // Get all task list items in the current view
        const taskItems = view.containerEl.querySelectorAll('.task-list-item');
        
        // Make each task item draggable
        taskItems.forEach((item, index) => {
            this.makeTaskItemDraggable(item, index);
        });
    }

    cleanupDraggables() {
        // Remove draggable functionality from all task items
        document.querySelectorAll('.task-list-item.draggable').forEach(item => {
            item.removeClass('draggable');
            item.removeClass('indentation-marker');
            
            // Remove drag handle
            const dragHandle = item.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
            
            // Remove event listeners
            // Note: This is a simplified version, in a real plugin you'd want to 
            // properly clean up all event listeners
            item.removeAttribute('draggable');
            item.removeAttribute('data-index');
        });
    }

    toggleDraggable() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        if (!view) return;
        
        // Check if draggable is already enabled
        const hasDraggable = view.containerEl.querySelector('.task-list-item.draggable');
        
        if (hasDraggable) {
            this.cleanupDraggables();
            new Notice('Draggable tasklists disabled');
        } else {
            this.initializeDraggableTasks();
            new Notice('Draggable tasklists enabled');
        }
    }
}

// Helper function to create a style element
function createStyleElement(css) {
    const el = document.createElement('style');
    el.type = 'text/css';
    el.textContent = css;
    return el;
}
