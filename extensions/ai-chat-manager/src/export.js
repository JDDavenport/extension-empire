// export.js — Export conversations as Markdown, JSON, PDF
const ACMExport = {
  toMarkdown(conv) {
    let md = `# ${conv.title || 'Conversation'}\n`;
    md += `**Platform:** ${conv.platform} | **Date:** ${new Date(conv.timestamp).toLocaleString()}\n\n---\n\n`;
    (conv.messages || []).forEach(m => {
      const role = m.role === 'user' ? '**You**' : '**Assistant**';
      md += `### ${role}\n\n${m.text}\n\n---\n\n`;
    });
    return md;
  },

  toJSON(conv) {
    return JSON.stringify({
      title: conv.title,
      platform: conv.platform,
      timestamp: conv.timestamp,
      messages: conv.messages,
      tags: conv.tags || [],
      folder: conv.folder || null
    }, null, 2);
  },

  toPDFHTML(conv) {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${conv.title || 'Conversation'}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.6; }
  h1 { border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
  .meta { color: #666; font-size: 0.9em; margin-bottom: 24px; }
  .msg { margin: 16px 0; padding: 16px; border-radius: 8px; }
  .msg.user { background: #f0f0ff; border-left: 4px solid #6366f1; }
  .msg.assistant { background: #f8f8f8; border-left: 4px solid #10b981; }
  .role { font-weight: 700; margin-bottom: 8px; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; overflow-x: auto; }
  code { font-size: 0.9em; }
</style></head><body>`;
    html += `<h1>${conv.title || 'Conversation'}</h1>`;
    html += `<div class="meta">${conv.platform} · ${new Date(conv.timestamp).toLocaleString()}</div>`;
    (conv.messages || []).forEach(m => {
      const cls = m.role === 'user' ? 'user' : 'assistant';
      const label = m.role === 'user' ? 'You' : 'Assistant';
      const text = m.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      html += `<div class="msg ${cls}"><div class="role">${label}</div>${text}</div>`;
    });
    html += `</body></html>`;
    return html;
  },

  download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  },

  exportConversation(conv, format) {
    const safeName = (conv.title || 'conversation').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    switch (format) {
      case 'markdown':
        this.download(`${safeName}.md`, this.toMarkdown(conv), 'text/markdown');
        break;
      case 'json':
        this.download(`${safeName}.json`, this.toJSON(conv), 'application/json');
        break;
      case 'pdf':
        const html = this.toPDFHTML(conv);
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
        break;
    }
  },

  generateShareHTML(conv) {
    return this.toPDFHTML(conv);
  }
};

if (typeof window !== 'undefined') {
  window.ACMExport = ACMExport;
}
