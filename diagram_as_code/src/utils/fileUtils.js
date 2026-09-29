export const saveConfig = cfg => {
  const data = new Blob([JSON.stringify(cfg, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(data);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `infra-config-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPNG = async el => {
  if (!el) return;
  if (!window.html2canvas) {
    alert('html2canvas not found – install it or take a manual screenshot');
    return;
  }
  const canvas = await window.html2canvas(el, {scale:2, backgroundColor:'#f8fafc'});
  const a = document.createElement('a');
  a.href   = canvas.toDataURL('image/png');
  a.download = `infra-diagram-${new Date().toISOString().slice(0,10)}.png`;
  a.click();
};
