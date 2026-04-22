package tn.esprit.challengeservice.services;

import tn.esprit.challengeservice.entities.Task;
import tn.esprit.challengeservice.entities.TaskStatus;

import java.util.List;

public interface itaskService {
    Task addTask(String challengeId, Task task);
    List<Task> getTasksByChallenge(String challengeId);
    Task updateTask(String id, Task task);
    Task updateTaskStatus(String taskId, TaskStatus status);
    void deleteTask(String id);
}
