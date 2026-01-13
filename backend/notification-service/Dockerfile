FROM eclipse-temurin:21-jdk-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file JAR đã build vào container (Sửa tên file .jar tùy service)
# Lưu ý: Bạn cần chạy `mvn clean package` trước để tạo file jar trong thư mục target
COPY target/*.jar app.jar

# Lệnh chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]