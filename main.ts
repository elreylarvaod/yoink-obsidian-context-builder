import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { buildContext } from 'src/buildContext';

// Remember to rename these classes and interfaces!

export interface YoinkPluginSettings {
  depth: number;
}

const DEFAULT_SETTINGS: YoinkPluginSettings = {
  depth: 2,
};

class YoinkResultModal extends Modal {
  constructor(app: App, private result: string) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.innerHTML = this.result;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class YoinkSettingTab extends PluginSettingTab {
  plugin: YoinkPlugin;

  constructor(app: App, plugin: YoinkPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Depth')
      .setDesc('Depth of links that are traversed')
      .addText(text => text
        .setPlaceholder(String(this.plugin.settings.depth))
        .setValue(String(this.plugin.settings.depth))
        .onChange(async (value) => {
          const newDepth = Number(value.replace(/\D/g, ''));
          if (!isNaN(newDepth)) {
            this.plugin.settings.depth = newDepth;
            await this.plugin.saveSettings();
          }
        }));
  }
}

export default class YoinkPlugin extends Plugin {
  settings: YoinkPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon('dice', 'Yoink', (evt: MouseEvent) => {
      this.executeYoink();
    });

    this.addCommand({
      id: 'build-context-with-current-note',
      name: 'Build full context with current note',
      checkCallback: (checking: boolean) => {
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          if (!checking) {
            this.executeYoink();
          }
          return true;
        }
      },
    });

    this.addSettingTab(new YoinkSettingTab(this.app, this));
  }

  async executeYoink() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView) {
      try {
        const result = await buildContext(this.app, this.settings);
        new YoinkResultModal(this.app, result).open();
      } catch (error) {
        new Notice('Error executing Yoink: ' + error.message);
      }
    } else {
      new Notice('No active Markdown view');
    }
  }

  onunload() {
    // Clean up resources if needed
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
