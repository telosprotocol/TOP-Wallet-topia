export function updateBadge(label = '') {
  label = String(label)
  chrome.action.setBadgeText({ text: label })
  chrome.action.setBadgeBackgroundColor({ color: '#037DD6' })
}