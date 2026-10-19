import { authenticated } from '@/lib/server/auth';
import { cleanup, db, type Lead, retentionCutoff } from '@/lib/server/db';
import { json } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET() {
  if (!await authenticated()) return json({}, 401);
  try {
    cleanup();
    const { default: ExcelJS } = await import('exceljs');
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Заявки', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      { header: 'ID', key: 'id', width: 38 }, { header: 'Дата (UTC)', key: 'created_at', width: 27 },
      { header: 'Имя', key: 'full_name', width: 30 }, { header: 'Телефон', key: 'phone', width: 23 },
      { header: 'Задача', key: 'message', width: 70 }, { header: 'Статус', key: 'status', width: 18 },
      { header: 'Согласие (UTC)', key: 'consent_at', width: 27 }, { header: 'Версия согласия', key: 'policy_version', width: 20 },
    ];
    const labels: Record<string, string> = { new: 'Новая', in_progress: 'В работе', closed: 'Закрыта' };
    // User content remains literal text, never an Excel formula.
    for (const row of db().prepare('SELECT * FROM leads WHERE created_at >= ? ORDER BY created_at DESC').iterate(retentionCutoff())) {
      const lead = row as Lead; sheet.addRow({ ...lead, status: labels[lead.status] });
    }
    sheet.eachRow(row => { row.font = { name: 'Arial', size: 11 }; row.alignment = { vertical: 'top', wrapText: true }; });
    sheet.getRow(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF153D3B' } };
    sheet.autoFilter = 'A1:H1';
    return new Response(new Uint8Array(await book.xlsx.writeBuffer()), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.xlsx"`, 'Cache-Control': 'no-store' } });
  } catch { return json({ error: 'Выгрузка временно недоступна.' }, 503); }
}
