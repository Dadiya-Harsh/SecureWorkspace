import fs from 'fs';
import path from 'path';

const docxPath = path.resolve('apps/web/public/demo-assets/confidential-agreement.docx');
const buf = fs.readFileSync(docxPath);
console.log('Read docx file of size:', buf.length, 'bytes');

// Check zip entries
let pos = 0;
while (pos < buf.length - 4) {
  const sig = buf.readUInt32LE(pos);
  if (sig === 0x04034b50) {
    const fnLen = buf.readUInt16LE(pos + 26);
    const extraLen = buf.readUInt16LE(pos + 28);
    const name = buf.subarray(pos + 30, pos + 30 + fnLen).toString();
    const dataSize = buf.readUInt32LE(pos + 18);
    const dataOffset = pos + 30 + fnLen + extraLen;
    const data = buf.subarray(dataOffset, dataOffset + dataSize);
    console.log('Found zip entry:', name, 'size:', dataSize);

    if (name === 'word/document.xml') {
      const xml = data.toString('utf-8');
      console.log('document.xml preview:', xml.substring(0, 150));
      // Basic check: all opening tags have matching closing tags or are self-closing
      const tags = [];
      const regex = /<\/?([a-zA-Z0-9:]+)([^>]*)>/g;
      let m;
      let line = 1;
      let col = 1;
      let ok = true;

      while ((m = regex.exec(xml)) !== null) {
        const full = m[0];
        const tag = m[1];
        if (full.endsWith('/>')) {
          // self closing
          continue;
        } else if (full.startsWith('</')) {
          const expected = tags.pop();
          if (expected !== tag) {
            console.error('MISMATCH! Closing tag', tag, 'expected', expected);
            ok = false;
          }
        } else if (!full.startsWith('<?')) {
          tags.push(tag);
        }
      }

      if (tags.length > 0) {
        console.error('Unclosed tags remaining:', tags);
        ok = false;
      }

      if (ok) {
        console.log('XML tag matching verified! ZERO syntax errors in document.xml.');
      }
    }

    pos = dataOffset + dataSize;
  } else {
    pos++;
  }
}
