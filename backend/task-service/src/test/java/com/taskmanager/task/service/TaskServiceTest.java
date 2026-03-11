package com.taskmanager.task.service;

import com.taskmanager.task.dto.CreateTaskRequest;
import com.taskmanager.task.dto.TaskDto;
import com.taskmanager.task.dto.UpdateTaskRequest;
import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskPriority;
import com.taskmanager.task.entity.TaskStatus;
import com.taskmanager.task.exception.TaskException;
import com.taskmanager.task.repository.AttachmentRepository;
import com.taskmanager.task.repository.TaskApprovalRequestRepository;
import com.taskmanager.task.repository.TaskProgressEntryRepository;
import com.taskmanager.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private TaskApprovalRequestRepository approvalRequestRepository;
    @Mock private TaskProgressEntryRepository progressEntryRepository;
    @Mock private IFileStorageService minioService;
    @Mock private ITaskEventPublisher kafkaProducer;

    @InjectMocks
    private TaskService taskService;

    private Task testTask;
    private UUID taskId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        userId = UUID.randomUUID();
        testTask = Task.builder()
                .id(taskId)
                .title("Test Task")
                .description("Test Description")
                .team("team-a")
                .status(TaskStatus.ACTIVE)
                .priority(TaskPriority.MEDIUM)
                .creatorId(userId)
                .assigneeIds(new HashSet<>(Set.of(userId)))
                .attachments(new ArrayList<>())
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();
    }

    @Test
    void createTaskDirect_success() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("New Task");
        request.setDescription("Description");
        request.setTeam("team-a");
        request.setPriority(TaskPriority.HIGH);
        request.setDueDate(LocalDateTime.now().plusDays(5));

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskDto result = taskService.createTaskDirect(request, userId, "admin");

        assertNotNull(result);
        assertEquals("New Task", result.getTitle());
        verify(kafkaProducer).sendTaskCreated(any(Task.class));
    }

    @Test
    void createTaskDirect_pastDueDate_throws() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Task");
        request.setDueDate(LocalDateTime.now().minusDays(1));

        assertThrows(TaskException.class, () ->
                taskService.createTaskDirect(request, userId, "admin"));
    }

    @Test
    void updateTaskDirect_success() {
        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle("Updated Title");

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDto result = taskService.updateTaskDirect(taskId, request, userId, "admin",
                Set.of("team-a"), false);

        assertEquals("Updated Title", testTask.getTitle());
        verify(kafkaProducer).sendTaskUpdated(any(Task.class));
    }

    @Test
    void updateTaskDirect_noTeamAccess_throws() {
        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle("Updated");

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        assertThrows(TaskException.class, () ->
                taskService.updateTaskDirect(taskId, request, userId, "admin",
                        Set.of("other-team"), false));
    }

    @Test
    void updateTaskDirect_superAdmin_bypassesTeamCheck() {
        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle("Updated");

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDto result = taskService.updateTaskDirect(taskId, request, userId, "superadmin",
                Set.of("other-team"), true);

        assertNotNull(result);
    }

    @Test
    void deleteTaskDirect_success() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        taskService.deleteTaskDirect(taskId, userId, "admin", Set.of("team-a"), false);

        verify(taskRepository).delete(testTask);
        verify(kafkaProducer).sendTaskDeleted(testTask);
    }

    @Test
    void markTaskPending_success() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDto result = taskService.markTaskPending(taskId, userId, "admin",
                Set.of("team-a"), false);

        assertEquals(TaskStatus.PENDING, testTask.getStatus());
        verify(kafkaProducer).sendTaskUpdated(testTask);
    }

    @Test
    void markTaskPending_notActive_throws() {
        testTask.setStatus(TaskStatus.COMPLETED);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        assertThrows(TaskException.class, () ->
                taskService.markTaskPending(taskId, userId, "admin",
                        Set.of("team-a"), false));
    }

    @Test
    void approveCompletion_success() {
        testTask.setStatus(TaskStatus.PENDING);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDto result = taskService.approveCompletion(taskId, userId, "admin",
                Set.of("team-a"), false);

        assertEquals(TaskStatus.COMPLETED, testTask.getStatus());
    }

    @Test
    void approveCompletion_notPending_throws() {
        testTask.setStatus(TaskStatus.ACTIVE);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        assertThrows(TaskException.class, () ->
                taskService.approveCompletion(taskId, userId, "admin",
                        Set.of("team-a"), false));
    }

    @Test
    void getTaskById_success() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        TaskDto result = taskService.getTaskById(taskId, Set.of("team-a"), false);

        assertEquals(taskId, result.getId());
    }

    @Test
    void getTaskById_notFound_throws() {
        UUID randomId = UUID.randomUUID();
        when(taskRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThrows(TaskException.class, () ->
                taskService.getTaskById(randomId, Set.of("team-a"), false));
    }

    @Test
    void getAllTasks_superAdmin_seesAll() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Task> page = new PageImpl<>(List.of(testTask), pageable, 1);
        when(taskRepository.findAll(pageable)).thenReturn(page);

        Page<TaskDto> result = taskService.getAllTasks(Set.of(), true, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getAllTasks_emptyTeams_returnsEmpty() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<TaskDto> result = taskService.getAllTasks(Set.of(), false, pageable);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAllTasks_filteredByTeam() {
        Pageable pageable = PageRequest.of(0, 10);
        Set<String> teams = Set.of("team-a");
        Page<Task> page = new PageImpl<>(List.of(testTask), pageable, 1);
        when(taskRepository.findByTeamIn(teams, pageable)).thenReturn(page);

        Page<TaskDto> result = taskService.getAllTasks(teams, false, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
