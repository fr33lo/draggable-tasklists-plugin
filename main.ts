import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

export default class DraggableTasklistsPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor(this.handleMarkdownPostProcessor.bind(this));
  }

  handleMarkdownPostProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    if (el.tagName.toLowerCase() === 'ul' && el.classList.contains('task-list')) {
      el.setAttribute('draggable', 'true');

      el.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', 'tasklist');
      });

      el.addEventListener('dragover', (event) => {
        event.preventDefault();
      });

      el.addEventListener('drop', (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData('text/plain');
        if (data === 'tasklist') {
          const target = event.target as HTMLElement;
          if (target && target !== el) {
            el.parentElement?.insertBefore(el, target);
          }
        }
      });
    }
  }
}
