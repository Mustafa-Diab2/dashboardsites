import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserReport {
    name: string;
    total: number;
    backlog: number;
    in_progress: number;
    review: number;
    done: number;
}

export function exportTeamReportToPDF(data: UserReport[], language: string) {
    const doc = new jsPDF() as any;
    const isAr = language === 'ar';

    // PDF Metadata
    doc.setProperties({
        title: 'Nexus Management - Team Performance Report',
        subject: 'Performance Analytics',
        author: 'Nexus System',
    });

    // Header
    doc.setFillColor(124, 58, 237); // Primary Purple
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(isAr ? 'تقرير أداء الفريق' : 'Team Performance Report', 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP', { locale: isAr ? ar : undefined })}`, 105, 33, { align: 'center' });

    // Table Data
    const tableColumn = isAr
        ? ['الموظف', 'الإجمالي', 'قيد الانتظار', 'قيد التنفيذ', 'مكتمل']
        : ['Member', 'Total Tasks', 'Backlog', 'In Progress', 'Done'];

    const tableRows = data.map(record => [
        record.name,
        record.total.toString(),
        record.backlog.toString(),
        record.in_progress.toString(),
        record.done.toString()
    ]);

    doc.autoTable({
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], halign: isAr ? 'right' : 'left' },
        styles: { font: 'helvetica', halign: isAr ? 'right' : 'left' },
        columnStyles: {
            0: { cellWidth: 60 }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount} - Nexus Management System`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`Team-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
