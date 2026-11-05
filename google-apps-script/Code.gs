/**
 * POLAROID__888 — ระบบรับจองคิว (Google Apps Script ผูกกับ Google Sheet)
 *
 * วิธีติดตั้งดูใน README.md หัวข้อ "ตั้งค่า Google Sheet"
 * Script Properties ที่ต้องตั้ง:
 *   SECRET          — รหัสลับเดียวกับ GOOGLE_SCRIPT_SECRET บน Vercel
 *   SLIP_FOLDER_ID  — (ไม่บังคับ) ID โฟลเดอร์ Google Drive เก็บสลิป ถ้าไม่ตั้งจะสร้างให้อัตโนมัติ
 */

var SHEET_NAME = 'Bookings';
// อ่าน/เขียนตามชื่อหัวคอลัมน์ — ย้ายหรือเพิ่มคอลัมน์ในชีตได้ ไม่พัง
var H = {
  createdAt: 'เวลาที่จอง',
  name: 'ชื่อ',
  phone: 'เบอร์โทร',
  ig: 'IG',
  date: 'วันที่ถ่าย',
  time: 'เวลาถ่าย',
  numbers: 'เลขลอตเตอรี่',
  amount: 'ยอดเงิน',
  slip: 'สลิป',
  status: 'สถานะ',
};
var STATUSES = ['รอตรวจสลิป', 'ยืนยันแล้ว', 'ถ่ายเสร็จแล้ว', 'ยกเลิก'];
var CANCELLED = 'ยกเลิก';
var TZ = 'Asia/Bangkok';

function doGet(e) {
  return handle_(function () {
    var p = e.parameter || {};
    checkSecret_(p.secret);
    if (p.action === 'booked') return { times: bookedTimes_(String(p.date || '')) };
    if (p.action === 'numbers') return { numbers: takenNumbers_() };
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
  // ล็อกทั้งสคริปต์ กันคนจองเวลา/เลขเดียวกันพร้อมกัน
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (bookedTimes_(b.date).indexOf(b.time) !== -1) {
      throw new Error('SLOT_TAKEN');
    }
    var taken = takenNumbers_();
    var clash = b.numbers.filter(function (n) { return taken.indexOf(n) !== -1; });
    if (clash.length) {
      throw new Error('NUMBER_TAKEN:' + clash.join(','));
    }

    var blob = Utilities.newBlob(
      Utilities.base64Decode(b.slip.base64),
      b.slip.mimeType,
      b.date + '_' + b.time.replace(':', '') + '_' + b.name + '_' + b.slip.fileName
    );
    var file = slipFolder_().createFile(blob);

    var record = {};
    record[H.createdAt] = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
    record[H.name] = b.name;
    record[H.phone] = b.phone;
    record[H.ig] = b.ig ? '@' + b.ig : '';
    record[H.date] = b.date;
    record[H.time] = b.time;
    record[H.numbers] = b.numbers.join(', ');
    record[H.amount] = b.amount;
    record[H.slip] = file.getUrl();
    record[H.status] = STATUSES[0];

    var sheet = getSheet_();
    var cols = columns_(sheet);
    var row = new Array(cols.width).fill('');
    Object.keys(record).forEach(function (k) { row[cols.index[k]] = record[k]; });
    var at = sheet.getLastRow() + 1;
    // ตั้งเป็น text ก่อน กัน Sheets แปลงวันที่/เบอร์โทร/เลขเอง
    sheet.getRange(at, 1, 1, cols.width).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();
    return {};
  } finally {
    lock.releaseLock();
  }
}

/** แถวที่ยังไม่ถูกยกเลิก เป็น object ตามชื่อหัวคอลัมน์ */
function activeRows_() {
  var sheet = getSheet_();
  var cols = columns_(sheet);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, cols.width).getValues()
    .map(function (r) {
      var o = {};
      Object.keys(cols.index).forEach(function (k) { o[k] = r[cols.index[k]]; });
      return o;
    })
    .filter(function (o) { return String(o[H.status]).trim() !== CANCELLED; });
}

function bookedTimes_(date) {
  return activeRows_()
    .filter(function (o) { return normDate_(o[H.date]) === date; })
    .map(function (o) { return normTime_(o[H.time]); });
}

function takenNumbers_() {
  var out = [];
  activeRows_().forEach(function (o) {
    String(o[H.numbers] || '').split(/[^0-9]+/).forEach(function (n) {
      if (n.length === 6) out.push(n);
    });
  });
  return out;
}

function normDate_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
}

function normTime_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  var s = String(v).trim();
  return s.length === 4 ? '0' + s : s; // "9:00" -> "09:00"
}

/** หาตำแหน่งคอลัมน์จากหัวตาราง ถ้าขาดคอลัมน์ไหนจะเติมต่อท้ายให้ */
function columns_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (v) { return String(v).trim(); });
  while (header.length && header[header.length - 1] === '') header.pop();
  var names = Object.keys(H).map(function (k) { return H[k]; });
  var missing = names.filter(function (n) { return header.indexOf(n) === -1; });
  if (missing.length) {
    sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    header = header.concat(missing);
  }
  var index = {};
  names.forEach(function (n) { index[n] = header.indexOf(n); });
  return { index: index, width: header.length };
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var names = Object.keys(H).map(function (k) { return H[k]; });
    sheet.getRange(1, 1, 1, names.length).setValues([names]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // dropdown สถานะ ให้ทีมเปลี่ยนได้ง่าย
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
    sheet.getRange(2, names.indexOf(H.status) + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
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
  columns_(getSheet_());
  slipFolder_();
}
