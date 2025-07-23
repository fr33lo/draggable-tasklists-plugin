import { Plugin, MarkdownView, Notice } from 'obsidian';
import { DraggableTasklistSettingTab, DraggableTasklistSettings } from './settings';

interface DragData {
    sourceElement: HTMLElement;
    sourceIndex: number;
    sourceParent: HTMLElement;
}

export default class DraggableTasklistPlugin extends Plugin {
    settings: DraggableTasklistSettings = {
        enableInPreviewMode: true,
        saveOrderAutomatically: true,
        dragHandleStyle: 'grab',
        customDragHandleClass: '',
        animationSpeed: 200,
        indentationMarker: true,
    };

    private styleEl: HTMLStyleElement | null = null;
    private dragData: DragData | null = null;
    private eventListeners: Map<HTMLElement, Array<{event: string, handler: EventListener}>> = new Map();

    async onload() {
        console.log('Loading Draggable Tasklist plugin');

        // Load settings
        await this.loadSettings();

        // Register settings tab
        this.addSettingTab(new DraggableTasklistSettingTab(this.app, this));

        // Register CSS styles
        this.registerStyles();

        // Register markdown post processor
        this.registerMarkdownPostProcessor((el, ctx) => {
            if (this.settings.enableInPreviewMode) {
                this.processTasks(el);
            }
        });

        // Register events
        this.registerEvents();

        // Add command to toggle draggable mode
        this.addCommand({
            id: 'toggle-draggable-tasklists',
            name: 'Toggle Draggable Tasklists',
            callback: () => this.toggleDraggable(),
        });

        new Notice('Draggable Tasklists plugin loaded');
    }

    onunload() {
        console.log('Unloading Draggable Tasklist plugin');
        this.cleanupDraggables();
        if (this.styleEl) {
            this.styleEl.remove();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, this.settings, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    registerStyles() {
        // Remove existing styles if they exist
        if (this.styleEl) {
            this.styleEl.remove();
        }

        // Create new style element
        this.styleEl = document.createElement('style');
        this.styleEl.textContent = `
            .task-list-item.draggable-task {
                cursor: ${this.settings.dragHandleStyle};
                position: relative;
                padding-left: 25px;
                transition: all ${this.settings.animationSpeed}ms ease;
                border-radius: 4px;
            }
            
            .task-list-item.draggable-task:hover {
                background-color: var(--background-modifier-hover);
            }
            
            .task-list-item.draggable-task.dragging {
                opacity: 0.5;
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }
            
            .task-list-item.draggable-task .drag-handle {
                position: absolute;
                left: 2px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-muted);
                cursor: grab;
                user-select: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                font-size: 12px;
                line-height: 1;
            }
            
            .task-list-item.draggable-task:hover .drag-handle {
                opacity: 1;
            }
            
            .task-list-item.draggable-task.drag-over {
                border: 2px solid var(--interactive-accent);
                background-color: var(--background-modifier-border);
            }
            
            ${this.settings.indentationMarker ? `
            .task-list-item.draggable-task.indentation-marker::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background-color: var(--interactive-accent-hover);
            }
            ` : ''}
        `;
        
        document.head.appendChild(this.styleEl);
    }

    registerEvents() {
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                setTimeout(() => this.initializeDraggableTasks(), 100);
            })
        );

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                setTimeout(() => this.initializeDraggableTasks(), 100);
            })
        );
    }

    processTasks(el: HTMLElement) {
        const taskListItems = el.querySelectorAll('.task-list-item');
        taskListItems.forEach((item, index) => {
            this.makeTaskItemDraggable(item as HTMLElement, index);
        });
    }

    makeTaskItemDraggable(item: HTMLElement, index: number) {
        // Skip if already made draggable
        if (item.classList.contains('draggable-task')) {
            return;
        }

        item.classList.add('draggable-task');
        
        if (this.settings.indentationMarker) {
            item.classList.add('indentation-marker');
        }
        
        // Create the drag handle
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        if (this.settings.customDragHandleClass) {
            dragHandle.classList.add(this.settings.customDragHandleClass);
        }
        dragHandle.innerHTML = '⋮⋮';
        item.insertBefore(dragHandle, item.firstChild);
        
        // Set attributes
        item.setAttribute('data-task-index', index.toString());
        item.setAttribute('draggable', 'true');
        
        // Add event listeners
        const listeners = [
            {event: 'dragstart', handler: this.handleDragStart.bind(this)},
            {event: 'dragend', handler: this.handleDragEnd.bind(this)},
            {event: 'dragover', handler: this.handleDragOver.bind(this)},
            {event: 'dragenter', handler: this.handleDragEnter.bind(this)},
            {event: 'dragleave', handler: this.handleDragLeave.bind(this)},
            {event: 'drop', handler: this.handleDrop.bind(this)}
        ];

        listeners.forEach(({event, handler}) => {
            item.addEventListener(event, handler);
        });

        this.eventListeners.set(item, listeners);
    }

    handleDragStart(e: DragEvent) {
        const target = (e.target as HTMLElement).closest('.task-list-item') as HTMLElement;
        if (!target) return;

        target.classList.add('dragging');
        
        const index = parseInt(target.getAttribute('data-task-index') || '0');
        const parent = target.parentElement;
        
        this.dragData = {
            sourceElement: target,
            sourceIndex: index,
            sourceParent: parent as HTMLElement
        };
        
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', index.toString());
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    handleDragEnd(e: DragEvent) {
        const target = (e.target as HTMLElement).closest('.task-list-item') as HTMLElement;
        if (target) {
            target.classList.remove('dragging');
        }
        
        // Clean up any drag-over states
        document.querySelectorAll('.task-list-item.drag-over').forEach(item => {
            item.classList.remove('drag-over');
        });
        
        this.dragData = null;
    }

    handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    handleDragEnter(e: DragEvent) {
        const target = (e.target as HTMLElement).closest('.task-list-item') as HTMLElement;
        if (target && !target.classList.contains('dragging')) {
            target.classList.add('drag-over');
        }
    }

    handleDragLeave(e: DragEvent) {
        const target = (e.target as HTMLElement).closest('.task-list-item') as HTMLElement;
        if (target && !this.isChildOfTarget(e.relatedTarget as Node, target)) {
            target.classList.remove('drag-over');
        }
    }

    async handleDrop(e: DragEvent) {
        e.preventDefault();
        const target = (e.target as HTMLElement).closest('.task-list-item') as HTMLElement;
        
        if (!target || !this.dragData) return;
        
        target.classList.remove('drag-over');
        
        const dropIndex = parseInt(target.getAttribute('data-task-index') || '0');
        const dragIndex = this.dragData.sourceIndex;
        
        if (dragIndex === dropIndex) return;
        
        await this.updateTaskOrder(dragIndex, dropIndex);
        
        // Refresh the view
        setTimeout(() => this.initializeDraggableTasks(), 100);
    }

    isChildOfTarget(node: Node | null, target: HTMLElement): boolean {
        while (node) {
            if (node === target) return true;
            node = node.parentNode;
        }
        return false;
    }

    async updateTaskOrder(fromIndex: number, toIndex: number) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        const editor = view.editor;
        const content = editor.getValue();
        const lines = content.split('\n');
        
        // Find all task lines
        const taskLines: Array<{lineIndex: number, content: string}> = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^\s*- \[([ x])\]/.test(line)) {
                taskLines.push({lineIndex: i, content: line});
            }
        }
        
        // Perform the move
        if (fromIndex < taskLines.length && toIndex < taskLines.length) {
            const movedTask = taskLines[fromIndex];
            taskLines.splice(fromIndex, 1);
            taskLines.splice(toIndex, 0, movedTask);
            
            // Update the original lines array
            taskLines.forEach((task, newIndex) => {
                const originalIndex = newIndex < taskLines.length - 1 ? 
                    taskLines.findIndex(t => t.lineIndex === task.lineIndex) : newIndex;
                if (originalIndex !== -1 && originalIndex < taskLines.length) {
                    lines[taskLines[originalIndex].lineIndex] = task.content;
                }
            });
            
            const newContent = lines.join('\n');
            editor.setValue(newContent);
            
            if (this.settings.saveOrderAutomatically && view.file) {
                await this.app.vault.modify(view.file, newContent);
                new Notice('Task order updated');
            }
        }
    }

    initializeDraggableTasks() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        
        this.cleanupDraggables();
        
        const taskItems = view.containerEl.querySelectorAll('.task-list-item');
        taskItems.forEach((item, index) => {
            this.makeTaskItemDraggable(item as HTMLElement, index);
        });
    }

    cleanupDraggables() {
        // Clean up event listeners
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({event, handler}) => {
                element.removeEventListener(event, handler);
            });
            
            // Remove classes and attributes
            element.classList.remove('draggable-task', 'indentation-marker', 'dragging', 'drag-over');
            element.removeAttribute('draggable');
            element.removeAttribute('data-task-index');
            
            // Remove drag handle
            const dragHandle = element.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
        });
        
        this.eventListeners.clear();
    }

    toggleDraggable() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        
        const hasDraggable = view.containerEl.querySelector('.task-list-item.draggable-task');
        
        if (hasDraggable) {
            this.cleanupDraggables();
            new Notice('Draggable tasklists disabled');
        } else {
            this.initializeDraggableTasks();
            new Notice('Draggable tasklists enabled');
        }
    }
}
