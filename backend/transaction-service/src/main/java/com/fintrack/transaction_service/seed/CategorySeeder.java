package com.fintrack.transaction_service.seed;

import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategorySeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra nếu DB chưa có category nào thì mới tạo
        if (categoryRepository.count() == 0) {
            log.info("Start seeding default categories...");

            // --- EXPENSE (CHI TIÊU) ---

            // 1. Ăn uống (Cha)
            Category food = Category.builder().name("Ăn uống").type(TransactionType.EXPENSE).build();
            Category foodSaved = categoryRepository.save(food);

            // Con của Ăn uống
            categoryRepository.saveAll(List.of(
                    Category.builder().name("Nhà hàng").type(TransactionType.EXPENSE).parent(foodSaved).build(),
                    Category.builder().name("Cafe").type(TransactionType.EXPENSE).parent(foodSaved).build(),
                    Category.builder().name("Đi chợ/Siêu thị").type(TransactionType.EXPENSE).parent(foodSaved).build()
            ));

            // 2. Dịch vụ sinh hoạt (Cha)
            Category bills = Category.builder().name("Dịch vụ sinh hoạt").type(TransactionType.EXPENSE).build();
            Category billsSaved = categoryRepository.save(bills);

            // Con của Dịch vụ
            categoryRepository.saveAll(List.of(
                    Category.builder().name("Điện").type(TransactionType.EXPENSE).parent(billsSaved).build(),
                    Category.builder().name("Nước").type(TransactionType.EXPENSE).parent(billsSaved).build(),
                    Category.builder().name("Internet").type(TransactionType.EXPENSE).parent(billsSaved).build(),
                    Category.builder().name("Thuê nhà").type(TransactionType.EXPENSE).parent(billsSaved).build()
            ));

            // --- INCOME (THU NHẬP) ---
            Category income = Category.builder().name("Thu nhập").type(TransactionType.INCOME).build();
            Category incomeSaved = categoryRepository.save(income);
            categoryRepository.saveAll(List.of(
                    Category.builder().name("Lương").type(TransactionType.INCOME).parent(incomeSaved).build(),
                    Category.builder().name("Thưởng").type(TransactionType.INCOME).parent(incomeSaved).build(),
                    Category.builder().name("Đầu tư").type(TransactionType.INCOME).parent(incomeSaved).build()
            ));

            log.info("Seeding categories completed!");
        }
    }
}
