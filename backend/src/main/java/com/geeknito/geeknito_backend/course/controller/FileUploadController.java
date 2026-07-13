package com.geeknito.geeknito_backend.course.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/files")
public class FileUploadController {

    @Value("${app.upload-dir:uploads/}")
    private String uploadDir;

    @Value("${app.file-download-base-url:http://localhost:8080}")
    private String fileDownloadBaseUrl;

    private String getUploadDir() {
        if (uploadDir == null) {
            return "uploads/";
        }
        return uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Create the uploads folder if it doesn't exist
            File directory = new File(getUploadDir());
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 2. Generate a unique file name so uploads don't overwrite each other
            String originalFileName = file.getOriginalFilename();
            String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;
            Path filePath = Paths.get(getUploadDir() + uniqueFileName);

            // 3. Save the file to the local folder
            Files.write(filePath, file.getBytes());

            // 4. Return the local download URL to the React frontend pointing to our download endpoint
            String fileDownloadUrl = fileDownloadBaseUrl + "/files/download/" + uniqueFileName;
            log.info("File saved locally. Download URL generated: {}", fileDownloadUrl);

            return ResponseEntity.ok(Map.of("url", fileDownloadUrl, "fileName", originalFileName));

        } catch (IOException e) {
            log.error("Failed to store file", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file"));
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(getUploadDir()).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                // Strip the UUID prefix (e.g., "uuid_originalName.ext") from the downloadable file name
                String originalName = fileName;
                int underscoreIndex = fileName.indexOf('_');
                if (underscoreIndex != -1 && underscoreIndex < fileName.length() - 1) {
                    originalName = fileName.substring(underscoreIndex + 1);
                }

                log.info("Serving download for file: {} with resolved content-type: {}", fileName, contentType);

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                        .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                        .body(resource);
            } else {
                log.warn("File not found or not readable: {}", fileName);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error downloading file: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}