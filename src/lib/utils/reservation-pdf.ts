import { jsPDF } from "jspdf";

type ReservationPDFData = {
  reservationId: string;
  reservationTitle: string;
  reservationStatus: "CONFIRMED" | "CANCELLED";
  startTime: string;
  endTime: string;
  notes: string | null;
  resource: {
    resourceName: string;
    resourceCode: string;
    location: string | null;
  };
};

const dateFormat = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  dateStyle: "long",
});

const timeFormat = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  hour: "numeric",
  minute: "2-digit",
});

type RGB = [number, number, number];

export function downloadReservationPDF(reservation: ReservationPDFData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = width - margin * 2;
  const indigo: RGB = [79, 70, 229];
  const dark: RGB = [15, 23, 42];
  const muted: RGB = [100, 116, 139];
  const border: RGB = [226, 232, 240];
  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const duration = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const cancelled = reservation.reservationStatus === "CANCELLED";

  function drawPageHeader() {
    pdf.setFillColor(...indigo);
    pdf.rect(0, 0, width, 33, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("ReserveHub", margin, 17);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("RESOURCE RESERVATION SYSTEM", margin, 24);
    pdf.text("BOOKING RECORD", width - margin, 18, { align: "right" });
  }

  function drawFooter() {
    const y = height - 14;
    pdf.setDrawColor(...border);
    pdf.line(margin, y - 8, width - margin, y - 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...muted);
    pdf.text(`Generated: ${dateFormat.format(new Date())}`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...indigo);
    pdf.text("ReserveHub", width - margin, y, { align: "right" });
  }

  function sectionTitle(title: string, y: number) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...dark);
    pdf.text(title, margin, y);
    pdf.setDrawColor(...border);
    pdf.line(margin, y + 3, width - margin, y + 3);
  }

  function field(label: string, value: string, x: number, y: number, maxWidth = 77) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...muted);
    pdf.text(label.toUpperCase(), x, y);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...dark);
    const lines = pdf.splitTextToSize(value, maxWidth) as string[];
    pdf.text(lines.slice(0, 3), x, y + 5);
  }

  drawPageHeader();
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(...border);
  pdf.roundedRect(margin, 41, contentWidth, 26, 3, 3, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...dark);
  pdf.text(cancelled ? "Reservation Cancelled" : "Reservation Confirmed", margin + 7, 52);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text("Current status at PDF generation", margin + 7, 60);
  pdf.setFillColor(...(cancelled ? ([254, 226, 226] as RGB) : ([220, 252, 231] as RGB)));
  pdf.roundedRect(width - margin - 36, 55, 29, 8, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...(cancelled ? ([185, 28, 28] as RGB) : ([21, 128, 61] as RGB)));
  pdf.text(reservation.reservationStatus, width - margin - 21.5, 60.5, { align: "center" });

  const rightColumn = margin + contentWidth / 2 + 4;
  const columnWidth = contentWidth / 2 - 7;
  sectionTitle("BOOKING INFORMATION", 78);
  field("Reservation Title", reservation.reservationTitle, margin, 89, columnWidth);
  field("Booking Reference", reservation.reservationId, rightColumn, 89, columnWidth);

  sectionTitle("RESOURCE DETAILS", 113);
  field("Resource Name", reservation.resource.resourceName, margin, 124, columnWidth);
  field("Resource Code", reservation.resource.resourceCode, rightColumn, 124, columnWidth);
  field("Location", reservation.resource.location || "Not specified", margin, 142, contentWidth);

  sectionTitle("RESERVATION SCHEDULE", 161);
  field("Date", dateFormat.format(start), margin, 172, columnWidth);
  field("Duration", duration, rightColumn, 172, columnWidth);
  field("Start Time", timeFormat.format(start), margin, 190, columnWidth);
  field("End Time", timeFormat.format(end), rightColumn, 190, columnWidth);

  sectionTitle("RESERVATION NOTES", 208);
  const notes = reservation.notes?.trim() || "No additional notes provided.";
  const noteX = margin + 5;
  const noteWidth = contentWidth - 10;
  const noteTop = 216;
  const noteBottom = height - 38;
  const maxNoteHeight = noteBottom - noteTop - 8;

  // Use the largest readable font that fits the notes on the first page.
  let noteFontSize = 9;
  let lineHeight = 4.6;
  let lines: string[] = [];
  for (const size of [9, 8.5, 8, 7.5]) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    const candidate = pdf.splitTextToSize(notes, noteWidth) as string[];
    const candidateLineHeight = size * 0.51;
    lines = candidate;
    noteFontSize = size;
    lineHeight = candidateLineHeight;
    if (candidate.length * candidateLineHeight <= maxNoteHeight) break;
  }

  const firstPageCapacity = Math.max(1, Math.floor(maxNoteHeight / lineHeight));
  const firstPageLines = lines.slice(0, firstPageCapacity);
  const firstBoxHeight = Math.max(15, firstPageLines.length * lineHeight + 9);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, noteTop, contentWidth, firstBoxHeight, 3, 3, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(noteFontSize);
  pdf.setTextColor(...dark);
  pdf.text(firstPageLines, noteX, noteTop + 7, { lineHeightFactor: 1.16 });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...muted);
  pdf.text("This record is not live verification. Check ReserveHub for current status.", margin, height - 28);
  drawFooter();

  // Extra pages are created only if notes cannot fit legibly on A4.
  let nextLine = firstPageCapacity;
  while (nextLine < lines.length) {
    pdf.addPage();
    drawPageHeader();
    sectionTitle("RESERVATION NOTES (CONTINUED)", 45);
    const top = 56;
    const capacity = Math.max(1, Math.floor((height - 39 - top) / lineHeight));
    const chunk = lines.slice(nextLine, nextLine + capacity);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(noteFontSize);
    pdf.setTextColor(...dark);
    pdf.text(chunk, margin, top, { lineHeightFactor: 1.16 });
    drawFooter();
    nextLine += chunk.length;
  }

  pdf.save(`ReserveHub-${reservation.reservationId}.pdf`);
}
