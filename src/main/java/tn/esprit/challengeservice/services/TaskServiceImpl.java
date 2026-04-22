package tn.esprit.challengeservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.challengeservice.entities.Challenge;
import tn.esprit.challengeservice.entities.Task;
import tn.esprit.challengeservice.entities.TaskStatus;
import tn.esprit.challengeservice.repositories.ChallengeRepository;
import tn.esprit.challengeservice.repositories.TaskRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements itaskService{

    private final TaskRepository taskRepository;
    private final ChallengeRepository challengeRepository;
    @Override
    public Task addTask(String challengeId, Task task) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        task.setChallenge(challenge);
        return taskRepository.save(task);
    }

    @Override
    public List<Task> getTasksByChallenge(String challengeId) {
        return taskRepository.findByChallengeIdChallenge(challengeId);
    }

    @Override
    public Task updateTask(String id, Task task) {
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        existing.setTitle(task.getTitle());
        existing.setDescription(task.getDescription());
        existing.setStatus(task.getStatus());
        existing.setDeadline(task.getDeadline());

        return taskRepository.save(existing);
    }

    @Override
    public Task updateTaskStatus(String taskId, TaskStatus status) {
        Task existing = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
        existing.setStatus(status);
        return taskRepository.save(existing);
    }

    @Override
    public void deleteTask(String id) {
        taskRepository.deleteById(id);
    }
}
