package com.taskmanager.task.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

public interface IFileStorageService {

    String uploadFile(UUID taskId, MultipartFile file);

    InputStream downloadFile(String objectName);

    void deleteFile(String objectName);
}
