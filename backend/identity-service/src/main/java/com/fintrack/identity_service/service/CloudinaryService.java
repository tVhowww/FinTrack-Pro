package com.fintrack.identity_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) {
        try {
            // Upload lên Cloudinary
            // "folder": "fintrack_avatars" -> Gom ảnh vào 1 thư mục cho gọn
            // "public_id": UUID -> Đặt tên file ngẫu nhiên để không bị trùng
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "fintrack_avatars",
                    "public_id", UUID.randomUUID().toString()
            ));

            // Trả về URL ảnh (secure_url là link https an toàn)
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Lỗi upload ảnh lên Cloudinary: " + e.getMessage());
        }
    }
}