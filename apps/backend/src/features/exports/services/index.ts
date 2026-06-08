import { exportRepository } from '../repositories';
import { AppError } from '../../../errors';
import { EXPORT_MAX_ROWS, toDisplayAmount } from '@moneytrack/shared';

export const exportService = {
  async exportTransactions(userId: string, filters: any) {
    const { count, items } = await exportRepository.getTransactionsForExport(userId, filters);
    if (count > EXPORT_MAX_ROWS) throw AppError.validation('EXPORT_TOO_LARGE', [{ message: 'Export rows (' + count + ') exceed limit (' + EXPORT_MAX_ROWS + ')' }]);
    return (filters.format === 'excel') ? this.buildExcel(items, count) : this.buildCsv(items, count);
  },
  buildCsv(items: any[], count: number) {
    const header = '\u65e5\u671f,\u7c7b\u578b,\u5206\u7c7b,\u91d1\u989d,\u7528\u9014,\u5907\u6ce8,\u5546\u6237';
    const rows = items.map((item: any) => [item.occurredAt.toISOString().slice(0, 10), item.type === 'EXPENSE' ? '\u652f\u51fa' : '\u6536\u5165', item.category.name, toDisplayAmount(item.amount).toFixed(2), esc(item.title), esc(item.note || ''), esc(item.merchant || '')].join(','));
    return { contentType: 'text/csv; charset=utf-8', filename: 'export_' + Date.now() + '.csv', data: '\uFEFF' + [header, ...rows].join('\r\n'), count };
  },
  buildExcel(items: any[], count: number) {
    const h = ['\u65e5\u671f','\u7c7b\u578b','\u5206\u7c7b','\u91d1\u989d','\u7528\u9014','\u5907\u6ce8','\u5546\u6237'];
    const rows = items.map((i: any) => {
      const d = [i.occurredAt.toISOString().slice(0,10), i.type==='EXPENSE'?'\u652f\u51fa':'\u6536\u5165', i.category.name, toDisplayAmount(i.amount), i.title, i.note||'', i.merchant||''];
      return '<Row>'+d.map(v=>'<Cell><Data ss:Type="'+(typeof v==='number'?'Number':'String')+'">'+xmlEsc(String(v))+'</Data></Cell>').join('')+'</Row>';
    });
    const xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table><Row>'+h.map(c=>'<Cell><Data ss:Type="String">'+xmlEsc(c)+'</Data></Cell>').join('')+'</Row>'+rows.join('')+'</Table></Worksheet></Workbook>';
    return { contentType: 'application/vnd.ms-excel', filename: 'export_' + Date.now() + '.xls', data: xml, count };
  }
};

function esc(v: string) { return (v.includes(',')||v.includes('"')||v.includes('\n')) ? '"'+v.replace(/"/g,'""')+'"' : v; }
function xmlEsc(v: string) { return v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
