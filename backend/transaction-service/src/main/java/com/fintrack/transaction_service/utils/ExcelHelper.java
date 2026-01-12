package com.fintrack.transaction_service.utils;

import com.fintrack.transaction_service.entity.Transaction;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ExcelHelper {
    public static String TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    static String[] HEADERS = { "Ngày giao dịch", "Danh mục", "Loại", "Số tiền", "Ví", "Ghi chú" };
    static String SHEET = "Transactions";

    public static ByteArrayInputStream transactionsToExcel(List<Transaction> transactions) {
        // Tạo Workbook (File Excel) và Sheet
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(SHEET);

            // Tạo Header Row (Dòng tiêu đề)
            Row headerRow = sheet.createRow(0);

            // Style cho Header (In đậm)
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }

            // Ghi dữ liệu từng dòng
            int rowIdx = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

            for (Transaction transaction : transactions) {
                Row row = sheet.createRow(rowIdx++);

                // Cột 1: Ngày
                row.createCell(0).setCellValue(formatter.format(transaction.getDate()));

                // Cột 2: Danh mục (Check null)
                String categoryName = transaction.getCategory() != null ? transaction.getCategory().getName() : "Không phân loại";
                row.createCell(1).setCellValue(categoryName);

                // Cột 3: Loại (INCOME/EXPENSE)
                row.createCell(2).setCellValue(transaction.getType().name());

                // Cột 4: Số tiền (Chuyển sang Double để Excel hiểu là số)
                row.createCell(3).setCellValue(transaction.getAmount().doubleValue());

                // Cột 5: Ví
                row.createCell(4).setCellValue(transaction.getWalletId());

                // Cột 6: Ghi chú
                row.createCell(5).setCellValue(transaction.getNote());
            }

            // Tự động giãn cột cho đẹp
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Fail to import data to Excel file: " + e.getMessage());
        }
    }
}
