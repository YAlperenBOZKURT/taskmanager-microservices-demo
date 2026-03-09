/**
 * JPA repo for tasks - Spring Data does the heavy lifting here.
 */
package com.taskmanager.task.repository;

import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    Page<Task> findByCreatorId(UUID creatorId, Pageable pageable);

    Page<Task> findByTeam(String team, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.team IN :teams")
    Page<Task> findByTeamIn(@Param("teams") Collection<String> teams, Pageable pageable);

    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.team IN :teams AND t.status = :status")
    Page<Task> findByTeamInAndStatus(@Param("teams") Collection<String> teams,
                                      @Param("status") TaskStatus status,
                                      Pageable pageable);

    @Query("SELECT t FROM Task t JOIN t.assigneeIds a WHERE a = :assigneeId")
    Page<Task> findByAssigneeId(@Param("assigneeId") UUID assigneeId, Pageable pageable);

    @Query("SELECT t FROM Task t JOIN t.assigneeIds a WHERE a = :assigneeId AND t.status = :status")
    Page<Task> findByAssigneeIdAndStatus(@Param("assigneeId") UUID assigneeId,
                                          @Param("status") TaskStatus status,
                                          Pageable pageable);
}
