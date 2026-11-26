export interface FileCardData {
  name: string;
  color: string;
  kind: 'doc' | 'pass' | 'photo' | 'note';
  tag: string;
  hash: string;
  size: string;
}

export const SAMPLE_FILES: FileCardData[] = [
  {
    name: 'Q3_tax_return.xlsx',
    color: '#F4E3BC',
    kind: 'doc',
    tag: 'XLSX',
    hash: '9f3a…c1.bin',
    size: '48 KB',
  },
  {
    name: 'Passport_scan.pdf',
    color: '#2B4C6F',
    kind: 'pass',
    tag: 'PDF',
    hash: 'b71d…44.bin',
    size: '1.2 MB',
  },
  {
    name: 'Goa_trip.jpg',
    color: '#fff',
    kind: 'photo',
    tag: 'JPG',
    hash: '3c0e…9a.bin',
    size: '3.4 MB',
  },
  {
    name: 'Notes.md',
    color: '#FFF1A8',
    kind: 'note',
    tag: 'MD',
    hash: 'e52b…07.bin',
    size: '6 KB',
  },
  {
    name: 'Payslip_Oct.pdf',
    color: '#D9EADF',
    kind: 'doc',
    tag: 'PDF',
    hash: '71f8…d2.bin',
    size: '92 KB',
  },
  {
    name: 'Lease_agreement.pdf',
    color: '#F2D3CC',
    kind: 'doc',
    tag: 'PDF',
    hash: '0ad4…6e.bin',
    size: '310 KB',
  },
];
