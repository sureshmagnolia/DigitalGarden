// Replace this URL with your deployed Google Apps Script Web App URL
export const API_URL = "https://script.google.com/macros/s/AKfycbzDc3CNzGQJcdjFI0C65hX75jtMmwKs2sWm0na3artDdSyDwkp6DiajPMf5wFtfgMn0/exec";

export async function submitPlantData(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "submit_plant",
      ...payload
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    }
  });
  return response.json();
}

export async function identifyPlantFromImage(base64Image) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "identify_plant",
      imageBase64: base64Image
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    }
  });
  return response.json();
}

export async function getApprovedSubmissions() {
  const response = await fetch(`${API_URL}?action=get_approved`);
  return response.json();
}

export async function getPendingSubmissions() {
  const response = await fetch(`${API_URL}?action=get_pending`);
  return response.json();
}

export async function approveSubmission(rowId) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "approve_plant",
      rowId: rowId
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    }
  });
  return response.json();
}

export async function rejectSubmission(rowId, fileId) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "reject_plant",
      rowId: rowId,
      fileId: fileId
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    }
  });
  return response.json();
}
