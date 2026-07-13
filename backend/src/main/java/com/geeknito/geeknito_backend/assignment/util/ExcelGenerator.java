package com.geeknito.geeknito_backend.assignment.util;

import com.geeknito.geeknito_backend.assignment.dto.AssignmentExportRow;
import com.geeknito.geeknito_backend.assignment.dto.BatchStudentExportRow;
import com.geeknito.geeknito_backend.entity.learning.AssignmentEntity;
import com.geeknito.geeknito_backend.entity.learning.BatchEntity;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ExcelGenerator {

    public static ByteArrayInputStream generateAssignmentExport(AssignmentEntity assignment, List<AssignmentExportRow> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Assignment Results");

            // Enable grid lines
            sheet.setDisplayGridlines(true);

            // Brand Purple Color (#6C1D5F)
            byte[] purpleRgb = new byte[]{(byte) 108, (byte) 29, (byte) 95};
            XSSFColor brandPurple = new XSSFColor(purpleRgb, null);

            // Light gray alternate zebra row color (#F3F4F6)
            byte[] zebraRgb = new byte[]{(byte) 243, (byte) 244, (byte) 246};
            XSSFColor zebraGray = new XSSFColor(zebraRgb, null);

            // Create styles
            // 1. Main Title style
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(brandPurple);

            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            // 2. Metadata Label style (Bold)
            XSSFFont metaLabelFont = workbook.createFont();
            metaLabelFont.setFontName("Calibri");
            metaLabelFont.setFontHeightInPoints((short) 10);
            metaLabelFont.setBold(true);

            XSSFCellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(metaLabelFont);

            // 3. Metadata Value style
            XSSFFont metaValueFont = workbook.createFont();
            metaValueFont.setFontName("Calibri");
            metaValueFont.setFontHeightInPoints((short) 10);

            XSSFCellStyle metaValueStyle = workbook.createCellStyle();
            metaValueStyle.setFont(metaValueFont);

            // 4. Table Header style
            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(brandPurple);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(headerStyle);

            // 5. Data cell style standard
            XSSFFont dataFont = workbook.createFont();
            dataFont.setFontName("Calibri");
            dataFont.setFontHeightInPoints((short) 10);

            XSSFCellStyle standardStyle = workbook.createCellStyle();
            standardStyle.setFont(dataFont);
            standardStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(standardStyle);

            // 6. Zebra row cell style
            XSSFCellStyle zebraStyle = workbook.createCellStyle();
            zebraStyle.setFont(dataFont);
            zebraStyle.setFillForegroundColor(zebraGray);
            zebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            zebraStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(zebraStyle);

            // Create title
            XSSFRow row0 = sheet.createRow(1);
            row0.setHeightInPoints(24);
            XSSFCell titleCell = row0.createCell(1);
            titleCell.setCellValue("GEEKNITO LMS - ASSIGNMENT EVALUATION REPORT");
            titleCell.setCellStyle(titleStyle);

            // Assignment Details Block
            int currentInfoRow = 3;

            // Row 3: Assignment Name
            XSSFRow rowAsg = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel1 = rowAsg.createCell(1);
            cellLabel1.setCellValue("Assignment Name:");
            cellLabel1.setCellStyle(metaLabelStyle);
            XSSFCell cellVal1 = rowAsg.createCell(2);
            cellVal1.setCellValue(assignment.getTitle());
            cellVal1.setCellStyle(metaValueStyle);

            // Row 4: Course Name
            XSSFRow rowCourse = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel2 = rowCourse.createCell(1);
            cellLabel2.setCellValue("Course Curriculum:");
            cellLabel2.setCellStyle(metaLabelStyle);
            XSSFCell cellVal2 = rowCourse.createCell(2);
            cellVal2.setCellValue(assignment.getCourse().getTitle());
            cellVal2.setCellStyle(metaValueStyle);

            // Row 5: Marks & Requirements
            XSSFRow rowMarks = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel3 = rowMarks.createCell(1);
            cellLabel3.setCellValue("Max Marks / Passing:");
            cellLabel3.setCellStyle(metaLabelStyle);
            XSSFCell cellVal3 = rowMarks.createCell(2);
            cellVal3.setCellValue(assignment.getMaxMarks() + " Marks / " + assignment.getPassingMarks() + " Marks");
            cellVal3.setCellStyle(metaValueStyle);

            // Row 6: Instructor
            XSSFRow rowInstructor = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel4 = rowInstructor.createCell(1);
            cellLabel4.setCellValue("Instructor / Evaluator:");
            cellLabel4.setCellStyle(metaLabelStyle);
            XSSFCell cellVal4 = rowInstructor.createCell(2);
            cellVal4.setCellValue(assignment.getTeacher().getFullName());
            cellVal4.setCellStyle(metaValueStyle);

            // Row 7: Generated Timestamp
            XSSFRow rowTime = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel5 = rowTime.createCell(1);
            cellLabel5.setCellValue("Report Generated On:");
            cellLabel5.setCellStyle(metaLabelStyle);
            XSSFCell cellVal5 = rowTime.createCell(2);
            LocalDateTime now = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            cellVal5.setCellValue(now.format(formatter));
            cellVal5.setCellStyle(metaValueStyle);

            // Row 8: empty spacing
            currentInfoRow++; // Row 9 is the spacing
            int headerRowNum = currentInfoRow; // Header Row index (10)

            // Table Headers
            String[] headers = {
                    "Roll Number",
                    "Student Name",
                    "Email",
                    "Assignment Name",
                    "Batch Name",
                    "Score",
                    "Percentage",
                    "Grade",
                    "Submission Status",
                    "Number of Attempts",
                    "Late Submission",
                    "Certificate Issued",
                    "Submitted At"
            };

            XSSFRow headerRow = sheet.createRow(headerRowNum);
            headerRow.setHeightInPoints(26);

            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill Table Data Rows
            int dataRowNum = headerRowNum + 1;
            for (int r = 0; r < rows.size(); r++) {
                AssignmentExportRow item = rows.get(r);
                XSSFRow row = sheet.createRow(dataRowNum++);
                row.setHeightInPoints(20);

                XSSFCellStyle currentStyle = (r % 2 == 1) ? zebraStyle : standardStyle;

                createCellWithStyle(row, 0, item.getRollNumber(), currentStyle);
                createCellWithStyle(row, 1, item.getStudentName(), currentStyle);
                createCellWithStyle(row, 2, item.getEmail(), currentStyle);
                createCellWithStyle(row, 3, item.getAssignmentName(), currentStyle);
                createCellWithStyle(row, 4, item.getBatchName(), currentStyle);
                createCellWithStyle(row, 5, item.getScore(), currentStyle);
                createCellWithStyle(row, 6, item.getPercentage(), currentStyle);
                createCellWithStyle(row, 7, item.getGrade(), currentStyle);
                createCellWithStyle(row, 8, item.getSubmissionStatus(), currentStyle);
                createCellWithStyle(row, 9, item.getNumberOfAttempts() != null ? String.valueOf(item.getNumberOfAttempts()) : "0", currentStyle);
                createCellWithStyle(row, 10, item.getLateSubmission(), currentStyle);
                createCellWithStyle(row, 11, item.getCertificateIssued(), currentStyle);
                createCellWithStyle(row, 12, item.getSubmittedAt(), currentStyle);
            }

            // Freeze first row (actually freeze everything above row headerRowNum + 1 so scroll-y stays beautiful)
            sheet.createFreezePane(0, headerRowNum + 1);

            // Enable Auto-Filter on the data columns
            if (rows.size() > 0) {
                sheet.setAutoFilter(new CellRangeAddress(headerRowNum, dataRowNum - 1, 0, headers.length - 1));
            }

            // Adjust Column Widths to fit beautifully
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Give a bit of safety padding
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1200, 3500));
            }

            // Write to stream
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public static ByteArrayInputStream generateBatchStudents(BatchEntity batch, List<BatchStudentExportRow> rows, String generatedByName) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Batch Students");

            // Enable grid lines
            sheet.setDisplayGridlines(true);

            // Brand Purple Color (#6C1D5F)
            byte[] purpleRgb = new byte[]{(byte) 108, (byte) 29, (byte) 95};
            XSSFColor brandPurple = new XSSFColor(purpleRgb, null);

            // Light gray alternate zebra row color (#F3F4F6)
            byte[] zebraRgb = new byte[]{(byte) 243, (byte) 244, (byte) 246};
            XSSFColor zebraGray = new XSSFColor(zebraRgb, null);

            // Create styles
            // 1. Main Title style
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(brandPurple);

            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            // 2. Metadata Label style (Bold)
            XSSFFont metaLabelFont = workbook.createFont();
            metaLabelFont.setFontName("Calibri");
            metaLabelFont.setFontHeightInPoints((short) 10);
            metaLabelFont.setBold(true);

            XSSFCellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(metaLabelFont);

            // 3. Metadata Value style
            XSSFFont metaValueFont = workbook.createFont();
            metaValueFont.setFontName("Calibri");
            metaValueFont.setFontHeightInPoints((short) 10);

            XSSFCellStyle metaValueStyle = workbook.createCellStyle();
            metaValueStyle.setFont(metaValueFont);

            // 4. Table Header style
            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(brandPurple);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(headerStyle);

            // 5. Data cell style standard
            XSSFFont dataFont = workbook.createFont();
            dataFont.setFontName("Calibri");
            dataFont.setFontHeightInPoints((short) 10);

            XSSFCellStyle standardStyle = workbook.createCellStyle();
            standardStyle.setFont(dataFont);
            standardStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(standardStyle);

            // 6. Zebra row cell style
            XSSFCellStyle zebraStyle = workbook.createCellStyle();
            zebraStyle.setFont(dataFont);
            zebraStyle.setFillForegroundColor(zebraGray);
            zebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            zebraStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(zebraStyle);

            // Create title
            XSSFRow row0 = sheet.createRow(1);
            row0.setHeightInPoints(24);
            XSSFCell titleCell = row0.createCell(1);
            titleCell.setCellValue("GEEKNITO LMS - BATCH STUDENT REPORT");
            titleCell.setCellStyle(titleStyle);

            // Details Block
            int currentInfoRow = 3;

            // Row 3: Batch Name
            XSSFRow rowBatch = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel1 = rowBatch.createCell(1);
            cellLabel1.setCellValue("Batch Name:");
            cellLabel1.setCellStyle(metaLabelStyle);
            XSSFCell cellVal1 = rowBatch.createCell(2);
            cellVal1.setCellValue(batch.getName());
            cellVal1.setCellStyle(metaValueStyle);

            // Row 4: Course Name
            XSSFRow rowCourse = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel2 = rowCourse.createCell(1);
            cellLabel2.setCellValue("Course Curriculum:");
            cellLabel2.setCellStyle(metaLabelStyle);
            XSSFCell cellVal2 = rowCourse.createCell(2);
            cellVal2.setCellValue(batch.getCourse() != null ? batch.getCourse().getTitle() : "N/A");
            cellVal2.setCellStyle(metaValueStyle);

            // Row 5: Generated On
            XSSFRow rowTime = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel3 = rowTime.createCell(1);
            cellLabel3.setCellValue("Report Generated On:");
            cellLabel3.setCellStyle(metaLabelStyle);
            XSSFCell cellVal3 = rowTime.createCell(2);
            LocalDateTime now = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            cellVal3.setCellValue(now.format(formatter));
            cellVal3.setCellStyle(metaValueStyle);

            // Row 6: Generated By
            XSSFRow rowBy = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel4 = rowBy.createCell(1);
            cellLabel4.setCellValue("Report Generated By:");
            cellLabel4.setCellStyle(metaLabelStyle);
            XSSFCell cellVal4 = rowBy.createCell(2);
            cellVal4.setCellValue(generatedByName);
            cellVal4.setCellStyle(metaValueStyle);

            // Row 7: Total Students
            XSSFRow rowTotal = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel5 = rowTotal.createCell(1);
            cellLabel5.setCellValue("Total Enrolled Students:");
            cellLabel5.setCellStyle(metaLabelStyle);
            XSSFCell cellVal5 = rowTotal.createCell(2);
            cellVal5.setCellValue(rows.size());
            cellVal5.setCellStyle(metaValueStyle);

            // Calculate active / inactive counts
            long activeCount = rows.stream().filter(r -> "Active".equalsIgnoreCase(r.getUserStatus())).count();
            long inactiveCount = rows.size() - activeCount;

            // Row 8: Active Students
            XSSFRow rowActive = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel6 = rowActive.createCell(1);
            cellLabel6.setCellValue("Active Student Accounts:");
            cellLabel6.setCellStyle(metaLabelStyle);
            XSSFCell cellVal6 = rowActive.createCell(2);
            cellVal6.setCellValue(activeCount);
            cellVal6.setCellStyle(metaValueStyle);

            // Row 9: Inactive Students
            XSSFRow rowInactive = sheet.createRow(currentInfoRow++);
            XSSFCell cellLabel7 = rowInactive.createCell(1);
            cellLabel7.setCellValue("Inactive Student Accounts:");
            cellLabel7.setCellStyle(metaLabelStyle);
            XSSFCell cellVal7 = rowInactive.createCell(2);
            cellVal7.setCellValue(inactiveCount);
            cellVal7.setCellStyle(metaValueStyle);

            // Row 10: empty spacing
            currentInfoRow++; // Row 10 is the spacing
            int headerRowNum = currentInfoRow; // Header Row index (11)

            // Table Headers
            String[] headers = {
                    "Student ID",
                    "Roll Number",
                    "Full Name",
                    "Email",
                    "Batch",
                    "Course",
                    "Enrollment Date",
                    "Enrollment Status",
                    "User Status",
                    "Joined Days Ago"
            };

            XSSFRow headerRow = sheet.createRow(headerRowNum);
            headerRow.setHeightInPoints(26);

            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill Table Data Rows
            int dataRowNum = headerRowNum + 1;
            for (int r = 0; r < rows.size(); r++) {
                BatchStudentExportRow item = rows.get(r);
                XSSFRow row = sheet.createRow(dataRowNum++);
                row.setHeightInPoints(20);

                XSSFCellStyle currentStyle = (r % 2 == 1) ? zebraStyle : standardStyle;

                createCellWithStyle(row, 0, item.getStudentId(), currentStyle);
                createCellWithStyle(row, 1, item.getRollNumber(), currentStyle);
                createCellWithStyle(row, 2, item.getFullName(), currentStyle);
                createCellWithStyle(row, 3, item.getEmail(), currentStyle);
                createCellWithStyle(row, 4, item.getBatchName(), currentStyle);
                createCellWithStyle(row, 5, item.getCourseTitle(), currentStyle);
                createCellWithStyle(row, 6, item.getEnrollmentDate(), currentStyle);
                createCellWithStyle(row, 7, item.getEnrollmentStatus(), currentStyle);
                createCellWithStyle(row, 8, item.getUserStatus(), currentStyle);
                createCellWithStyle(row, 9, item.getJoinedDaysAgo(), currentStyle);
            }

            // Freeze first row
            sheet.createFreezePane(0, headerRowNum + 1);

            // Enable Auto-Filter
            if (rows.size() > 0) {
                sheet.setAutoFilter(new CellRangeAddress(headerRowNum, dataRowNum - 1, 0, headers.length - 1));
            }

            // Adjust Column Widths
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1200, 3500));
            }

            // Write to stream
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private static void createCellWithStyle(XSSFRow row, int colIndex, String val, XSSFCellStyle style) {
        XSSFCell cell = row.createCell(colIndex);
        cell.setCellValue(val != null ? val : "");
        cell.setCellStyle(style);
    }

    private static void applyBorders(XSSFCellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }
}
