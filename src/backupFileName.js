// Backup filenames use device-local time, not UTC, for easy recognition in iCloud Drive.
export function backupFileName(date=new Date()){
 const pad=value=>String(value).padStart(2,'0');
 const stamp=`${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
 return `NEXPEN_${stamp}.json`;
}
