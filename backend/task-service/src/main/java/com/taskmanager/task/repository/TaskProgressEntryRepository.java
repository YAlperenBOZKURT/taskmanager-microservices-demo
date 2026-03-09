package com.taskmanager.task.repository;

import com.taskmanager.task.entity.TaskProgressEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskProgressEntryRepository extends JpaRepository<TaskProgressEntry, UUID> {

    List<TaskProgressEntry> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
}
