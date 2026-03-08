/**
 * Separate controller just for downloading attachments - streams files
 * directly from MinIO to the client.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.controller;

import com.taskmanager.task.entity.Attachment;
import com.taskmanager.task.exception.TaskException;
import com.taskmanager.task.repository.AttachmentRepository;
import com.taskmanager.task.service.MinioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/tasks/attachments")
@RequiredArgsConstructor
public class AttachmentDownloadController {

    private final AttachmentRepository attachmentRepository;
    private final MinioService minioService;

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<InputStreamResource> downloadAttachment(@PathVariable UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new TaskException("Attachment not found", HttpStatus.NOT_FOUND));

        // stream the file from minio - no need to buffer the whole thing in memory
        InputStream inputStream = minioService.downloadFile(attachment.getFilePath());

        // fallback to octet-stream if content type wasn't stored for some reason
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        attachment.getContentType() != null ? attachment.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(new InputStreamResource(inputStream));
    }
}
