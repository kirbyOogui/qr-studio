import { jsPDF } from "jspdf";

/** PNGのBlobをA4中央配置のPDFとして書き出す(印刷用途を想定)。 */
export async function exportPngBlobAsPdf(pngBlob: Blob, fileName: string): Promise<void> {
  const dataUrl = await blobToDataUrl(pngBlob);
  const image = await loadImage(dataUrl);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const maxSize = Math.min(pageWidth, pageHeight) * 0.7;
  const scale = maxSize / Math.max(image.width, image.height);
  const renderWidth = image.width * scale;
  const renderHeight = image.height * scale;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(dataUrl, "PNG", x, y, renderWidth, renderHeight);
  pdf.save(fileName);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
