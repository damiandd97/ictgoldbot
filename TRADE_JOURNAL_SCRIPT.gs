// ════════════════════════════════════════════════════════════════════════════
//  ICT GOLD BOT — Trade Journal (Google Apps Script)
//  Paste this into Google Apps Script to create a free trade journal
//  that automatically logs every trade the bot places or closes
//
//  SETUP INSTRUCTIONS:
//  1. Go to Google Sheets (sheets.google.com) — create a new sheet
//  2. Name it "ICT Bot Trade Journal"
//  3. Click Extensions → Apps Script
//  4. Delete all existing code and paste this entire file
//  5. Click Save (floppy disk icon)
//  6. Click Deploy → New deployment
//  7. Type: Web app
//  8. Execute as: Me
//  9. Who has access: Anyone
//  10. Click Deploy → Copy the Web App URL
//  11. Paste that URL as GOOGLE_SHEET_URL in Netlify environment variables
// ════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date', 'Symbol', 'Type', 'Volume', 'Entry',
        'Stop Loss', 'Take Profit', 'Close Price',
        'Profit/Loss', 'Result', 'Score', 'Reason',
        'Mode', 'Balance'
      ]);
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setBackground('#1a1a2e');
      headerRange.setFontColor('#ffd700');
      headerRange.setFontWeight('bold');
    }

    // Format profit/loss with colour
    const profit    = parseFloat(data.profit) || 0;
    const result    = data.result || 'CLOSED';
    const rowColour = result === 'TP HIT'  ? '#d4edda' :
                      result === 'SL HIT'  ? '#f8d7da' : '#fff3cd';

    // Append the trade row
    const row = sheet.appendRow([
      data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString(),
      data.symbol     || '',
      data.type       || '',
      data.volume     || '',
      data.entry      || '',
      data.stopLoss   || '',
      data.takeProfit || '',
      data.closePrice || '',
      profit !== 0 ? profit.toFixed(2) : '',
      result,
      data.score      || '',
      data.reason     || '',
      data.mode       || '',
      data.balance    || ''
    ]);

    // Colour the row based on result
    const lastRow    = sheet.getLastRow();
    const rowRange   = sheet.getRange(lastRow, 1, 1, 14);
    rowRange.setBackground(rowColour);

    // Auto-resize columns
    sheet.autoResizeColumns(1, 14);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Returns a summary of the trade journal
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data  = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ trades: 0, message: 'No trades yet' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Skip header row
    const trades = data.slice(1);
    let wins=0, losses=0, totalProfit=0;

    for (const row of trades) {
      const result = row[9];
      const profit = parseFloat(row[8]) || 0;
      if (result === 'TP HIT')  { wins++;   totalProfit += profit; }
      if (result === 'SL HIT')  { losses++;  totalProfit += profit; }
    }

    const total   = wins + losses;
    const winRate = total > 0 ? ((wins/total)*100).toFixed(1) : 0;

    return ContentService
      .createTextOutput(JSON.stringify({
        trades:      trades.length,
        wins,
        losses,
        winRate:     winRate + '%',
        totalProfit: totalProfit.toFixed(2)
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
