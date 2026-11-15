import fs from 'fs';
import path from 'path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name);
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(dataBuf);
    const size = dataBuf.length;

    // Local Header
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // signature
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0, 6); // flags
    lh.writeUInt16LE(0, 8); // compression method (0 = STORED)
    lh.writeUInt16LE(0, 10); // mod time
    lh.writeUInt16LE(0, 12); // mod date
    lh.writeUInt32LE(crc, 14); // crc32
    lh.writeUInt32LE(size, 18); // compressed size
    lh.writeUInt32LE(size, 22); // uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, dataBuf);

    // Central Directory Header
    const ch = Buffer.alloc(46 + nameBuf.length);
    ch.writeUInt32LE(0x02014b50, 0); // signature
    ch.writeUInt16LE(20, 4); // version made by
    ch.writeUInt16LE(20, 6); // version needed
    ch.writeUInt16LE(0, 8); // flags
    ch.writeUInt16LE(0, 10); // compression method
    ch.writeUInt16LE(0, 12); // mod time
    ch.writeUInt16LE(0, 14); // mod date
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(size, 20);
    ch.writeUInt32LE(size, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); // extra len
    ch.writeUInt16LE(0, 32); // comment len
    ch.writeUInt16LE(0, 34); // disk num
    ch.writeUInt16LE(0, 36); // internal attr
    ch.writeUInt32LE(0, 38); // external attr
    ch.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(ch, 46);

    centralHeaders.push(ch);

    offset += lh.length + dataBuf.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(entries.length, 8); // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="0F5C4D"/>
        </w:rPr>
        <w:t>MUTUAL NON-DISCLOSURE AGREEMENT</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="20"/>
          <w:color w:val="5A6662"/>
        </w:rPr>
        <w:t>SecureWorkspace Cryptographic &amp; Architecture Audit Version 14</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="14201C"/>
        </w:rPr>
        <w:t>1. Confidentiality &amp; Cryptographic Scope</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="180"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>This document contains privileged trade secrets and proprietary technical architecture for SecureWorkspace. All data stored within the workspace is encrypted using Argon2id key derivation and XChaCha20-Poly1305 multi-chunk SecretStream before transit to remote storage.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="14201C"/>
        </w:rPr>
        <w:t>2. Zero-Knowledge Obligations</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="180"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Neither Google Drive nor any intermediary cloud infrastructure holds encryption keys or plaintext. Decryption occurs solely inside the user's volatile WebAssembly memory space in a dedicated Web Worker and is zeroized on lock.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="14201C"/>
        </w:rPr>
        <w:t>3. Verification &amp; Auditing</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>The Parties agree that cryptographic integrity is verified against immutable manifest hashes (SHA-256) and Poly1305 chunk MACs before any document is presented to the user.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Signatures:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:color w:val="5A6662"/>
        </w:rPr>
        <w:t>[ Digitally Signed &amp; Sealed - SecureWorkspace Engineering Team ]</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

const zipBuf = createZip([
  { name: '[Content_Types].xml', data: contentTypes },
  { name: '_rels/.rels', data: rels },
  { name: 'word/document.xml', data: documentXml },
]);

const outDir = path.resolve('apps/web/public/demo-assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'confidential-agreement.docx'), zipBuf);
console.log('Successfully wrote confidential-agreement.docx (' + zipBuf.length + ' bytes)');
