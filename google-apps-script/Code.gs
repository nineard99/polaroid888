/**
 * โพลารอยด์ 888 — ระบบรับจองคิว (Google Apps Script ผูกกับ Google Sheet)
 *
 * วิธีติดตั้งดูใน README.md หัวข้อ "ตั้งค่า Google Sheet"
 * Script Properties ที่ต้องตั้ง:
 *   SECRET          — รหัสลับเดียวกับ GOOGLE_SCRIPT_SECRET บน Vercel
 *   SLIP_FOLDER_ID  — (ไม่บังคับ) ID โฟลเดอร์ Google Drive เก็บสลิป ถ้าไม่ตั้งจะสร้างให้อัตโนมัติ
 */

var SHEET_NAME = 'Bookings';
// คอลัมน์ใหม่ต่อท้ายเสมอ ชีตเดิมจะได้ไม่เพี้ยน
var HEADERS = ['เวลาที่จอง', 'รหัสการจอง', 'ชื่อ', 'เบอร์โทร', 'วันที่ถ่าย', 'เวลาถ่าย', 'ยอดเงิน', 'สลิป', 'สถานะ', 'IG'];
var COL = { date: 4, time: 5, status: 8 }; // index (0-based) ใน HEADERS
var CANCELLED = 'ยกเลิก';
var TZ = 'Asia/Bangkok';

function doGet(e) {
  return handle_(function () {
    var p = e.parameter || {};
    checkSecret_(p.secret);
    if (p.action === 'booked') {
      return { times: bookedTimes_(String(p.date || '')) };
    }
    throw new Error('UNKNOWN_ACTION');
  });
}

function doPost(e) {
  return handle_(function () {
    var body = JSON.parse(e.postData.contents);
    checkSecret_(body.secret);
    if (body.action === 'book') return book_(body);
    throw new Error('UNKNOWN_ACTION');
  });
}

function book_(b) {
  // ล็อกทั้งสคริปต์ กันคนจองเวลาเดียวกันพร้อมกัน
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (bookedTimes_(b.date).indexOf(b.time) !== -1) {
      throw new Error('SLOT_TAKEN');
    }

    var bookingId = 'P888-' + Utilities.formatDate(new Date(), TZ, 'MMdd') + '-' +
      Utilities.getUuid().slice(0, 4).toUpperCase();

    var bytes = Utilities.base64Decode(b.slip.base64);
    var blob = Utilities.newBlob(bytes, b.slip.mimeType, bookingId + '_' + b.slip.fileName);
    var file = slipFolder_().createFile(blob);

    var sheet = getSheet_();
    var row = sheet.getLastRow() + 1;
    var values = [[
      Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      bookingId,
      b.name,
      b.phone,
      b.date,
      b.time,
      b.amount,
      file.getUrl(),
      'รอตรวจสลิป',
      b.ig ? '@' + b.ig : '',
    ]];
    // ตั้งเป็น text ก่อน กัน Sheets แปลงวันที่/เบอร์โทรเอง
    sheet.getRange(row, 1, 1, HEADERS.length).setNumberFormat('@').setValues(values);
    SpreadsheetApp.flush();

    return { bookingId: bookingId };
  } finally {
    lock.releaseLock();
  }
}

/** เวลาที่ถูกจองแล้วในวันนั้น (ไม่นับแถวที่สถานะ "ยกเลิก") */
function bookedTimes_(date) {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var times = [];
  rows.forEach(function (r) {
    if (String(r[COL.status]).trim() === CANCELLED) return;
    if (normDate_(r[COL.date]) === date) times.push(normTime_(r[COL.time]));
  });
  return times;
}

function normDate_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
}

function normTime_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  var s = String(v).trim();
  return s.length === 4 ? '0' + s : s; // "9:00" -> "09:00"
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    // dropdown สถานะ ให้ทีมเปลี่ยนได้ง่าย
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['รอตรวจสลิป', 'ยืนยันแล้ว', 'ถ่ายเสร็จแล้ว', CANCELLED], true)
      .build();
    sheet.getRange(2, COL.status + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  }
  // ชีตที่สร้างไว้ก่อนเพิ่มคอลัมน์ใหม่ → เติมหัวตารางให้ครบ
  if (sheet.getRange(1, HEADERS.length).getValue() !== HEADERS[HEADERS.length - 1]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  }
  return sheet;
}

function slipFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SLIP_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  var folder = DriveApp.createFolder('Polaroid888 - Slips');
  props.setProperty('SLIP_FOLDER_ID', folder.getId());
  return folder;
}

function checkSecret_(secret) {
  var expected = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!expected || secret !== expected) throw new Error('UNAUTHORIZED');
}

function handle_(fn) {
  var out;
  try {
    out = { ok: true, data: fn() };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** รันครั้งแรกจาก editor เพื่อสร้างชีตและขอสิทธิ์ Drive/Sheets */
function setup() {
  getSheet_();
  slipFolder_();
}
