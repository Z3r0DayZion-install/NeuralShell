import fs from 'fs';
import path from 'path';

/**
 * Tool Forge
 * 
 * Allows Agents to dynamically create new capabilities.
 * Tools are saved as JS modules with accompanying metadata.
 */
export class ToolForge {
  constructor(toolsDir = './src/tools') {
    this.toolsDir = toolsDir;
    if (!fs.existsSync(this.toolsDir)) {
      fs.mkdirSync(this.toolsDir, { recursive: true });
    }
  }

  /**
   * Register a new AI-generated tool
   */
  async forgeTool(name, code, schema) {
    const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    const filePath = path.join(this.toolsDir, fileName);

    const toolData = {
      name,
      code,
      schema,
      createdAt: new Date().toISOString(),
      metadata: {
        description: schema.description || '',
        parameters: schema.parameters || {}
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(toolData, null, 2), 'utf8');
    console.log(`[Forge] 🔨 Tool Invented: ${name}`);
    
    return { name, path: filePath, schema };
  }

  async listTools() {
    if (!fs.existsSync(this.toolsDir)) return [];
    
    const files = fs.readdirSync(this.toolsDir).filter(f => f.endsWith('.json'));
    const tools = [];
    
    for (const file of files) {
      try {
        const fullPath = path.join(this.toolsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const toolData = JSON.parse(content);
        
        tools.push({
          fileName: file,
          name: toolData.name || file.replace('.json', ''),
          description: toolData.metadata?.description || '',
          parameters: toolData.metadata?.parameters || {},
          code: toolData.code // Include code but don't execute
        });
      } catch (e) {
        console.warn(`[Forge] Failed to load tool ${file}:`, e.message);
      }
    }
    return tools;
  }
}

export const GlobalToolForge = new ToolForge();
