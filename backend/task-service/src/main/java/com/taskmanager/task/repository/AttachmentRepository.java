/**
 * Simple repo for attachment metadata lookups.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.repository;

import com.taskmanager.task.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByTaskId(UUID taskId);
}
